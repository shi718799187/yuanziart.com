/* ============================================================
   圆子 · 插画师品牌站 — 统计埋点
   覆盖 PRD §9：来源渠道 / 页面 PV·UV / 按钮点击事件 / 离开页面位置

   设计原则：
   1. 工具无关 —— 自动适配 GA4(gtag)、GTM(dataLayer)、Plausible、Umami；
      未接入任何第三方时事件进入本地队列，接入后用 SiteTrack.flush(url) 补报。
   2. 不采集个人信息 —— 只用匿名随机 ID，不记录 IP、手机号、微信号内容。
   3. 尊重 Do Not Track，提供 SiteTrack.optOut()。
   4. 任何异常都不得影响页面功能。
   ============================================================ */
(function (window, document) {
  "use strict";

  var VID_KEY = "yz_vid";      // 访客标识（localStorage，用于 UV 去重）
  var SID_KEY = "yz_sid";      // 会话标识（sessionStorage）
  var LAND_KEY = "yz_landing"; // 着陆页（会话内首个页面）
  var QUEUE_KEY = "yz_queue";  // 未接入第三方时的本地队列
  var QUEUE_MAX = 200;
  var DEBUG = /[?&]yz_debug=1/.test(window.location.search);

  /* ---------- 存储（隐私模式下 localStorage 可能抛错） ---------- */
  function store(key, value, persistent) {
    try {
      var s = persistent ? window.localStorage : window.sessionStorage;
      if (value === undefined) return s.getItem(key);
      s.setItem(key, value);
      return value;
    } catch (e) {
      return value === undefined ? null : value;
    }
  }

  function rid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  var vid = store(VID_KEY, undefined, true);
  if (!vid) { vid = rid("v"); store(VID_KEY, vid, true); }

  var sid = store(SID_KEY, undefined, false);
  if (!sid) { sid = rid("s"); store(SID_KEY, sid, false); }

  var landing = store(LAND_KEY, undefined, false);
  if (!landing) { landing = window.location.pathname; store(LAND_KEY, landing, false); }

  var optedOut = false;
  try {
    optedOut = window.localStorage.getItem("yz_optout") === "1" ||
      (window.navigator.doNotTrack === "1" || window.doNotTrack === "1");
  } catch (e) { /* ignore */ }

  /* ---------- 来源渠道 ---------- */
  var SOCIAL_RULES = [
    [/weixin|wechat|mp\.weixin/i, "wechat"],
    [/weibo\.com/i, "weibo"],
    [/xiaohongshu|xhslink/i, "xiaohongshu"],
    [/douyin|iesdouyin/i, "douyin"],
    [/bilibili/i, "bilibili"],
    [/zhihu\.com/i, "zhihu"]
  ];
  var SEARCH_RULES = /baidu|google|bing|sogou|so\.com|yahoo|duckduckgo/i;

  function readSource() {
    var q = new URLSearchParams(window.location.search);
    var utm = {
      source: q.get("utm_source") || "",
      medium: q.get("utm_medium") || "",
      campaign: q.get("utm_campaign") || "",
      term: q.get("utm_term") || "",
      content: q.get("utm_content") || ""
    };
    var ref = "";
    try { ref = document.referrer ? new URL(document.referrer).hostname : ""; }
    catch (e) { ref = document.referrer || ""; }

    var channel;
    if (utm.source) {
      channel = "utm";
    } else if (!ref) {
      channel = "direct";
    } else {
      channel = "referral";
      for (var i = 0; i < SOCIAL_RULES.length; i++) {
        if (SOCIAL_RULES[i][0].test(ref)) { channel = SOCIAL_RULES[i][1]; break; }
      }
      if (channel === "referral" && SEARCH_RULES.test(ref)) channel = "search";
    }
    return { channel: channel, referrer: ref, utm: utm };
  }

  var SOURCE = readSource();
  var PAGE = window.location.pathname.split("/").pop() || "index.html";

  /* ---------- 分发到已接入的统计工具 ---------- */
  function dispatch(name, payload) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, payload);
      }
      if (Object.prototype.toString.call(window.dataLayer) === "[object Array]") {
        var dl = { event: name };
        for (var k in payload) { if (payload.hasOwnProperty(k)) dl[k] = payload[k]; }
        window.dataLayer.push(dl);
      }
      if (typeof window.plausible === "function" && name !== "page_view") {
        window.plausible(name, { props: payload }); // 页面浏览量由 Plausible 自动统计，避免重复
      }
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track(name, payload);
      }
      if (typeof window.YZ_TRACK === "function") {
        window.YZ_TRACK(name, payload); // 自定义钩子
      }
    } catch (e) { /* 统计异常不得影响业务 */ }
  }

  function enqueue(rec) {
    try {
      var raw = window.localStorage.getItem(QUEUE_KEY);
      var q = raw ? JSON.parse(raw) : [];
      if (Object.prototype.toString.call(q) !== "[object Array]") q = [];
      q.push(rec);
      if (q.length > QUEUE_MAX) q = q.slice(-QUEUE_MAX);
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) { /* 队列满或隐私模式：丢弃 */ }
  }

  var seq = 0;
  function track(name, props) {
    if (optedOut) return;
    var rec = {
      event: name,
      ts: Date.now(),
      page: PAGE,
      title: document.title || "",
      vid: vid,
      sid: sid,
      landing: landing,
      channel: SOURCE.channel,
      referrer: SOURCE.referrer,
      utm: SOURCE.utm,
      seq: ++seq
    };
    if (props) { for (var k in props) { if (props.hasOwnProperty(k)) rec[k] = props[k]; } }

    dispatch(name, rec);
    if (typeof window.gtag !== "function" && !window.dataLayer && !window.plausible && !window.umami) {
      enqueue(rec); // 尚未接入第三方：暂存本地
    }
    if (DEBUG && window.console) window.console.log("[track]", name, rec);
    return rec;
  }

  /* ---------- 离开位置：滚动深度 + 当前所在区块 ---------- */
  function scrollDepth() {
    var doc = document.documentElement;
    var max = (doc.scrollHeight || 0) - window.innerHeight;
    if (max <= 0) return 100;
    return Math.min(100, Math.round((window.scrollY || doc.scrollTop || 0) / max * 100));
  }

  function currentSection() {
    var mid = (window.scrollY || 0) + window.innerHeight / 2;
    var nodes = document.querySelectorAll("main [data-section]");
    var found = "";
    for (var i = 0; i < nodes.length; i++) {
      var r = nodes[i].getBoundingClientRect();
      var top = r.top + (window.scrollY || 0);
      if (mid >= top && mid < top + r.height) {
        found = nodes[i].getAttribute("data-section");
        break;
      }
    }
    return found || (window.scrollY < 200 ? "top" : "");
  }

  var exitSent = false;
  function sendExit(reason) {
    if (optedOut || exitSent) return;
    exitSent = true;
    track("page_exit", {
      reason: reason,
      scroll_depth: scrollDepth(),
      section: currentSection(),
      dwell_ms: Date.now() - START
    });
  }

  var START = Date.now();

  /* ---------- 自动埋点 ---------- */
  function bind() {
    // 页面 PV
    track("page_view", {});

    // 按钮 / 链接点击事件：给元素加 data-track="事件名" 即可
    document.addEventListener("click", function (e) {
      var el = e.target;
      while (el && el !== document) {
        if (el.getAttribute && el.getAttribute("data-track")) {
          track(el.getAttribute("data-track"), {
            label: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
            href: el.getAttribute("href") || "",
            section: sectionOf(el)
          });
          return;
        }
        el = el.parentNode;
      }
    }, true);

    // 外链跳转（授课平台 / 社交账号）
    document.addEventListener("click", function (e) {
      var a = e.target;
      while (a && a !== document && a.tagName !== "A") a = a.parentNode;
      if (!a || a.tagName !== "A") return;
      var href = a.getAttribute("href") || "";
      if (!/^https?:/i.test(href)) return;
      try {
        if (new URL(href).host !== window.location.host) {
          track("outbound_click", { href: href, section: sectionOf(a) });
        }
      } catch (err) { /* ignore */ }
    }, true);

    // 离开页面位置
    window.addEventListener("pagehide", function () { sendExit("pagehide"); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") sendExit("hidden");
    });
  }

  function sectionOf(el) {
    var n = el;
    while (n && n !== document) {
      if (n.getAttribute && n.getAttribute("data-section")) return n.getAttribute("data-section");
      n = n.parentNode;
    }
    return "";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }

  window.SiteTrack = {
    track: track,
    // 上报本地暂存队列（接入自建后端后调用）
    flush: function (endpoint) {
      try {
        var raw = window.localStorage.getItem(QUEUE_KEY);
        var q = raw ? JSON.parse(raw) : [];
        if (!q.length) return 0;
        var body = JSON.stringify({ events: q });
        var ok = window.navigator.sendBeacon ? window.navigator.sendBeacon(endpoint, body) : false;
        if (!ok) {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", endpoint, false); // 页面卸载阶段需同步发送
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(body);
        }
        window.localStorage.removeItem(QUEUE_KEY);
        return q.length;
      } catch (e) { return 0; }
    },
    peek: function () {
      try { return JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]"); }
      catch (e) { return []; }
    },
    clear: function () { try { window.localStorage.removeItem(QUEUE_KEY); } catch (e) {} },
    optOut: function () {
      optedOut = true;
      try { window.localStorage.setItem("yz_optout", "1"); } catch (e) {}
    },
    ids: function () { return { vid: vid, sid: sid, channel: SOURCE.channel }; }
  };
})(window, document);
