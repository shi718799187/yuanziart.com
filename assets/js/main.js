/* 圆子 · 插画师品牌站 v5 — 纸艺 · 明亮和声 · 叠纸 3D */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  /* ============================================================
     SITE_CONFIG — 全站唯一配置源
     品牌方提供真实信息后只改这里（PRD §11.2 开放问题）
     ============================================================ */
  var SITE_CONFIG = {
    wechatId: "yuanzi8288",
    wechatQr: "assets/images/wechat-qr.png",   // 放入真实二维码即生效，缺失时显示占位
    email: "931981993@qq.com",
    /* TODO: 填入真实授课平台地址；留空则页脚只显示名称，不生成链接 */
    platform: { name: "CCtalk", url: "" }
  };

  /* 微信号 / 邮箱 / 平台名在 content/site-data.js 里只定义一次，由页脚渲染到 DOM 上。
     这里优先读页面上的值 —— site-data.js 因此是唯一来源，
     上面那几行只作"main.js 被单独引用时"的兜底。
     旧写法是同一个微信号在 site-data.js 和这里各写一份，改一处就漏一处。 */
  try {
    var wxEl = document.querySelector("[data-wechat][data-wechat-id]");
    if (wxEl) SITE_CONFIG.wechatId = wxEl.getAttribute("data-wechat-id");
    var mailEl = document.querySelector("[data-email]");
    if (mailEl) SITE_CONFIG.email = mailEl.getAttribute("data-email");
    var platEl = document.querySelector("[data-platform][data-platform-name]");
    if (platEl) SITE_CONFIG.platform.name = platEl.getAttribute("data-platform-name");
  } catch (e) { /* 读不到就用上面的默认值 */ }

  /* ============================================================
     自定义光标 — 铅笔
     可用性功能，不因 prefers-reduced-motion 关闭
     ============================================================ */
  var dot = null;
  if (finePointer) {
    try {
      dot = document.createElement("div");
      dot.className = "cursor-dot";
      dot.innerHTML =
        '<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect x="14" y="38" width="10" height="12" rx="3" fill="#1A1A1A"/>' +
        '<rect x="24" y="38" width="4" height="12" fill="#C9C9C9"/>' +
        '<line x1="25.4" y1="38" x2="25.4" y2="50" stroke="#9AA0A6" stroke-width="0.6"/>' +
        '<line x1="26.6" y1="38" x2="26.6" y2="50" stroke="#9AA0A6" stroke-width="0.6"/>' +
        '<rect x="28" y="38" width="30" height="12" fill="#1A1A1A"/>' +
        '<rect x="28" y="39.8" width="30" height="2" fill="rgba(255,255,255,0.16)"/>' +
        '<line x1="43" y1="38" x2="43" y2="50" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>' +
        '<polygon points="58,38 58,50 67,44" fill="#E8C9A0"/>' +
        '<polygon points="67,41.4 67,46.6 75,44" fill="#2B2B2B"/>' +
        "</svg>";
      document.body.appendChild(dot);
      document.body.classList.add("cursor-on");

      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var tx = cx, ty = cy;
      var hovering = false, pressing = false;
      var TRAIL_COLORS = ["#FF8A4C", "#5FCBF2", "#97D64F", "#FFCE2E", "#FF9AA8", "#AC93F0"];
      var lastTX = null, lastTY = null, trailIdx = 0, trailCount = 0;
      var TRAIL_MAX = 60, TRAIL_GAP = 9;

      var spawnTrail = function (x, y) {
        if (prefersReduced || trailCount >= TRAIL_MAX) return;
        var t = document.createElement("span");
        t.className = "cursor-trail";
        t.style.setProperty("--tx", x + "px");
        t.style.setProperty("--ty", y + "px");
        t.style.background = TRAIL_COLORS[trailIdx % TRAIL_COLORS.length];
        trailIdx++;
        var s = 7 + Math.random() * 6;
        t.style.width = s + "px";
        t.style.height = s + "px";
        t.style.marginLeft = (-s / 2) + "px";
        t.style.marginTop = (-s / 2) + "px";
        t.addEventListener("animationend", function () {
          if (t.parentNode) t.parentNode.removeChild(t);
          trailCount--;
        });
        document.body.appendChild(t);
        trailCount++;
      };

      var onMove = function (e) {
        tx = e.clientX; ty = e.clientY;
        if (lastTX === null || Math.abs(e.clientX - lastTX) + Math.abs(e.clientY - lastTY) > TRAIL_GAP) {
          spawnTrail(e.clientX, e.clientY);
          lastTX = e.clientX; lastTY = e.clientY;
        }
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("pointerdown", function () { pressing = true; }, true);
      window.addEventListener("pointerup", function () { pressing = false; }, true);

      (function loop() {
        cx += (tx - cx) * 0.38;
        cy += (ty - cy) * 0.38;
        var scale = pressing ? 0.78 : (hovering ? 0.86 : 1);
        dot.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%) rotate(135deg) scale(" + scale + ")";
        requestAnimationFrame(loop);
      })();

      $$("a, button, .gallery .item, .faq-q, .work-card").forEach(function (el) {
        el.addEventListener("pointerenter", function () { hovering = true; });
        el.addEventListener("pointerleave", function () { hovering = false; });
      });
    } catch (err) {
      document.body.classList.remove("cursor-on");
      if (dot && dot.parentNode) dot.parentNode.removeChild(dot);
    }
  }

  /* 竖排签名栏 */
  try {
    var rail = document.createElement("div");
    rail.className = "side-rail";
    rail.textContent = "圆子 · ILLUSTRATOR · EST. 2016";
    document.body.appendChild(rail);
  } catch (e) { /* 装饰性 */ }

  /* ============================================================
     叠纸 3D 视差
     JS 只负责把指针/陀螺仪位置归一化成 --mx/--my（−1~1），
     位移与倾斜全部交给 CSS 计算；只动 transform，走合成层
     ============================================================ */
  if (!prefersReduced) {
    $$("[data-tilt]").forEach(function (stage) {
      var pending = false, mx = 0, my = 0;
      var clamp = function (v) { return v < -1 ? -1 : (v > 1 ? 1 : v); };
      var apply = function () {
        pending = false;
        stage.style.setProperty("--mx", mx.toFixed(3));
        stage.style.setProperty("--my", my.toFixed(3));
      };
      var set = function (x, y) {
        mx = clamp(x); my = clamp(y);
        if (!pending) { pending = true; requestAnimationFrame(apply); }
      };

      if (finePointer) {
        stage.addEventListener("pointermove", function (e) {
          var r = stage.getBoundingClientRect();
          set(((e.clientX - r.left) / r.width - 0.5) * 2,
              ((e.clientY - r.top) / r.height - 0.5) * 2);
        }, { passive: true });
        stage.addEventListener("pointerleave", function () { set(0, 0); });
      } else if ("DeviceOrientationEvent" in window) {
        /* Android 直接可用；iOS 需授权，未授权则不触发，静默降级 */
        window.addEventListener("deviceorientation", function (e) {
          if (e.gamma == null || e.beta == null) return;
          set(e.gamma / 26, (e.beta - 45) / 26);
        }, { passive: true });
      }
    });
  }

  /* ============================================================
     导航 / 菜单
     ============================================================ */
  var nav = $(".nav");
  var onScroll = function () { if (nav) nav.classList.toggle("scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $(".nav-burger");
  var links = $(".nav-links");
  var lockScroll = function (on) { document.documentElement.classList.toggle("menu-open", on); };
  var closeMenu = function () {
    if (burger) {
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "打开菜单");
    }
    if (links) links.classList.remove("open");
    lockScroll(false);
  };

  if (burger && links) {
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "打开菜单");
    burger.addEventListener("click", function () {
      var open = !links.classList.contains("open");
      burger.classList.toggle("open", open);
      links.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
      lockScroll(open);
      /* 打开时把焦点送进菜单，键盘 / 读屏用户不用再往后 Tab 一遍 */
      if (open) {
        var firstLink = $("a", links);
        if (firstLink) firstLink.focus();
      }
    });
    $$("a", links).forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1000) closeMenu();
    }, { passive: true });
  }

  /* ============================================================
     入场动画 / 数字滚动
     ============================================================ */
  var revealEls = $$("[data-reveal], [data-reveal-lines]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  var animateCount = function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600, start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var countEls = $$("[data-count]");
  if (countEls.length && "IntersectionObserver" in window && !prefersReduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { cio.observe(el); });
  } else {
    countEls.forEach(function (el) {
      el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ============================================================
     作品集筛选
     ============================================================ */
  var filterBtns = $$(".filters button");
  var items = $$(".gallery .item");
  if (filterBtns.length && items.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        var f = btn.getAttribute("data-filter");
        items.forEach(function (item) {
          var show = f === "all" || item.getAttribute("data-cat") === f;
          item.style.display = show ? "" : "none";
          if (show) item.classList.add("in");
        });
      });
    });
  }

  /* ============================================================
     灯箱
     ============================================================ */
  var lb = $("#lightbox");
  if (lb) {
    var lbImg = $("img", lb), lbCap = $(".cap", lb);
    var lbClose = $(".close", lb), lbPrev = $(".prev", lb), lbNext = $(".next", lb);
    var lbItems = [], lbIndex = 0, lbLastFocus = null;
    var lbFocusables = [lbClose, lbPrev, lbNext].filter(Boolean);

    var openLb = function (idx) {
      if (!lbItems.length) return;
      if (!lb.classList.contains("open")) lbLastFocus = document.activeElement;
      lbIndex = (idx + lbItems.length) % lbItems.length;
      var it = lbItems[lbIndex];
      lbImg.src = it.src;
      lbImg.alt = it.alt || "";
      if (lbCap) lbCap.textContent = it.cap || "";
      lb.setAttribute("aria-label", "作品大图" + (it.cap ? "：" + it.cap : ""));
      lb.classList.add("open");
      document.documentElement.style.overflow = "hidden";
      /* 把焦点移进对话框本体，不然键盘焦点还留在背后的页面上 */
      if (lbClose) lbClose.focus();
    };
    var closeLb = function () {
      lb.classList.remove("open");
      document.documentElement.style.overflow = "";
      /* 焦点还给当初打开它的那张卡片，键盘用户不会"丢"在页面顶部 */
      if (lbLastFocus && lbLastFocus.focus) lbLastFocus.focus();
      lbLastFocus = null;
    };
    lbItems = $$(".gallery .item").map(function (el) {
      var img = $("img", el);
      return {
        src: img ? img.getAttribute("src") : "",
        alt: img ? img.getAttribute("alt") : "",
        cap: el.getAttribute("data-cap") || ""
      };
    });
    $$(".gallery .item").forEach(function (el, i) {
      el.addEventListener("click", function () { openLb(i); });
      /* 卡片本身是 div（role=button），回车 / 空格也要能打开 */
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          openLb(i);
        }
      });
    });
    if (lbClose) lbClose.addEventListener("click", closeLb);
    if (lbPrev) lbPrev.addEventListener("click", function (e) { e.stopPropagation(); openLb(lbIndex - 1); });
    if (lbNext) lbNext.addEventListener("click", function (e) { e.stopPropagation(); openLb(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") { closeLb(); return; }
      if (e.key === "ArrowLeft") { openLb(lbIndex - 1); return; }
      if (e.key === "ArrowRight") { openLb(lbIndex + 1); return; }
      /* 焦点陷阱：Tab 只在对话框内的几个控件之间循环 */
      if (e.key === "Tab" && lbFocusables.length) {
        var first = lbFocusables[0], last = lbFocusables[lbFocusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ============================================================
     FAQ 折叠
     ============================================================ */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item), a = $(".faq-a", item);
    if (!q || !a) return;
    /* 折叠按钮要能读出"展开 / 收起"状态 */
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      $$(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        $(".faq-a", o).style.maxHeight = "";
        var oq = $(".faq-q", o);
        if (oq) oq.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ============================================================
     微信咨询弹层 —— 用户主动触发，非常驻（PRD §7 禁止悬浮窗/弹窗）
     ============================================================ */
  var wxModal = null, wxLastFocus = null;

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var legacyCopy = function (text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* 复制失败 */ }
    document.body.removeChild(ta);
  };

  function buildWechatModal() {
    if (wxModal) return wxModal;
    var cfg = SITE_CONFIG;
    var el = document.createElement("div");
    el.className = "modal";
    el.id = "wx-modal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "wx-modal-title");
    el.hidden = true;
    el.innerHTML =
      '<div class="modal__backdrop" data-wx-close></div>' +
      '<div class="modal__panel">' +
        '<button type="button" class="modal__close" data-wx-close aria-label="关闭">&times;</button>' +
        '<span class="eyebrow">WeChat</span>' +
        '<h3 class="modal__title" id="wx-modal-title">微信咨询 / 报名</h3>' +
        '<p class="modal__note">添加时请备注「插画课」，我会在 1–2 个工作日内回复。<br>' +
          '你提供的联系方式仅用于课程咨询，不会用于其他用途。</p>' +
        '<div class="wx-qr" data-wx-qr>' +
          '<img src="' + esc(cfg.wechatQr) + '" alt="微信二维码" width="190" height="190">' +
          '<div class="wx-qr__ph"><span class="tag-sample">建设中</span>' +
            '<small>二维码待上传<br>放入 assets/images/wechat-qr.png 后自动显示</small></div>' +
        '</div>' +
        '<div class="wx-id"><span class="mono">微信号</span>' +
          '<code data-wx-id>' + esc(cfg.wechatId) + '</code>' +
          '<button type="button" class="wx-copy" data-wx-copy>复制</button></div>' +
        '<a class="btn btn--outline btn--block" href="mailto:' + esc(cfg.email) + '">或发邮件咨询</a>' +
      '</div>';
    document.body.appendChild(el);

    var img = $("img", el), qr = $("[data-wx-qr]", el);
    img.addEventListener("error", function () { qr.classList.add("is-missing"); });
    if (img.complete && img.naturalWidth === 0) qr.classList.add("is-missing");

    var copyBtn = $("[data-wx-copy]", el), code = $("[data-wx-id]", el);
    copyBtn.addEventListener("click", function () {
      var text = code.textContent.trim();
      var done = function () {
        copyBtn.textContent = "已复制";
        copyBtn.classList.add("ok");
        setTimeout(function () { copyBtn.textContent = "复制"; copyBtn.classList.remove("ok"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
      } else {
        legacyCopy(text, done);
      }
      if (window.SiteTrack) window.SiteTrack.track("wechat_copy", {});
    });

    wxModal = el;
    return el;
  }

  function openWechat(trigger) {
    var el = buildWechatModal();
    wxLastFocus = trigger || document.activeElement;
    el.hidden = false;
    document.documentElement.style.overflow = "hidden";
    var closeBtn = $(".modal__close", el);
    if (closeBtn) closeBtn.focus();
    if (window.SiteTrack) window.SiteTrack.track("wechat_open", {});
  }

  function closeWechat() {
    if (!wxModal || wxModal.hidden) return;
    wxModal.hidden = true;
    document.documentElement.style.overflow = "";
    if (wxLastFocus && wxLastFocus.focus) wxLastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.getAttribute && t.getAttribute("data-wechat") !== null) {
        e.preventDefault();
        openWechat(t);
        return;
      }
      if (t.getAttribute && t.getAttribute("data-wx-close") !== null) {
        closeWechat();
        return;
      }
      t = t.parentNode;
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeWechat();
  });

  /* 授课平台链接：配置了 url 才升级成链接，否则只显示名称（不造假链） */
  $$("[data-platform]").forEach(function (el) {
    var url = SITE_CONFIG.platform && SITE_CONFIG.platform.url;
    if (!url) return;
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = el.textContent;
    el.parentNode.replaceChild(a, el);
  });

  /* 年份 */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
