/* ============================================================
   作品「胶片长廊」—— 3D 循环卡带
   ------------------------------------------------------------
   形式改编自 ThreeUI CharacterCarousel（filmstrip 变体）。
   原作是「全屏 iframe + 9 张写死的肖像」，这里改成站内的渐进增强版 ——
   卡片由 HTML 提供，JS 只负责排位，所以脚本被拦截时作品照样看得见。

   与原作一致的部分：
     · 相位 / 目标分离 + 每帧缓动，wrappedDelta 取模实现无限循环
     · 距离 → focus = e^(-d²·1.28) → 缩放 / 纵移 / 三轴旋转 / 模糊 / 透明度
     · 指针视差（横向展开整条长廊，纵向抬镜头）、静置 3.6 秒后缓慢漂移
     · 卡片间距随视口宽度插值
   与原作不同的部分（都是站内约束，不是随手改的）：
     · 滚轮默认不劫持 —— 需要时用 data-filmstrip-wheel="1" 显式打开
     · 方向键只在长廊内部有焦点时接管，页面其它位置照常滚动
     · 只有当前卡可 Tab 到，其余 tabindex=-1，避免 Tab 穿过一串看不见的卡
     · 移出视口 / 切到后台停 rAF；prefers-reduced-motion 下不做漂移
     · 窄屏保持横向队列（原作切纵向），原因见 layout() 里的注释
   ============================================================ */
(function (window, document) {
  "use strict";

  var stages = document.querySelectorAll("[data-filmstrip]");
  if (!stages.length) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 长廊里"实心"能撑到多远：|delta| 小于它就一直不透明，之后 1.4 张的距离内淡到 0。
     数值越大，两侧伸出去的卡越多、长廊越长；越小越收紧。 */
  var FILMSTRIP_BAND = 4.6;

  Array.prototype.forEach.call(stages, function (stage) { init(stage); });

  function clamp(v) { return v < -1 ? -1 : (v > 1 ? 1 : v); }

  function init(stage) {
    var deck = stage.querySelector(".filmstrip-deck");
    if (!deck) return;

    var cards = Array.prototype.slice.call(deck.querySelectorAll(".fc-card"));
    var count = cards.length;
    if (count < 2) return;

    var cache = cards.map(function () {
      return { t: null, o: null, b: null, z: null, a: null, f: null, p: null };
    });
    var compactMq = window.matchMedia("(max-width: 650px)");

    /* ---------- 舞台几何（只在初始化 / 改变尺寸时读一次） ----------
       舞台是 overflow:hidden，投影跑到边界外的卡会被切成一道竖条。
       所以每张卡的透明度必须乘上一个"贴近边界就归零"的系数 ——
       系数要用它真实的投影位置来算，不能拍脑袋定阈值（窗口一改就失效）。

       卡片的投影规律就是浏览器算透视的那一条：
         屏幕位移 = 位移 × P / (P − z)，宽度同样按 P / (P − z) 缩放
       P 直接读 CSS 上的 perspective（桌面 1450 / 手机 900），
       卡片布局宽度读 offsetWidth（不含 transform），两者都在改尺寸时重新读。
       实测：390 宽下算出的位移 104 / 175 / 235 / 282 与浏览器实测
       103 / 175 / 237 / 279 对得上。 */
    var geom = { persp: 1450, cardW: 0, half: 0 };
    function readGeom() {
      var p = parseFloat(window.getComputedStyle(stage).perspective);
      geom.persp = (isNaN(p) || p <= 0) ? 1450 : p;
      geom.cardW = cards[0].offsetWidth || 200;
      geom.half = stage.clientWidth / 2;
    }
    var useWheel = stage.getAttribute("data-filmstrip-wheel") === "1";
    var useIdle = stage.getAttribute("data-filmstrip-idle") !== "0";

    /* 速度 / 缩放每帧现读一次属性：原作里这两个值也是可以被宿主随时改的
       （React 包装层用 postMessage 推新值），所以这里支持运行中调节。
       speed = 0 等价于暂停，和原作的 paused 判断一致。 */
    function readSpeed() {
      var v = parseFloat(stage.getAttribute("data-speed"));
      return isNaN(v) ? 1 : Math.max(0, Math.min(2.5, v));
    }
    function readScale() {
      var v = parseFloat(stage.getAttribute("data-scale"));
      return isNaN(v) ? 1 : Math.max(0.7, Math.min(1.3, v));
    }

    /* 静止位 = 第 0 张（也就是第一件精选作品）在正中 */
    var phase = 0, target = 0, base = 0;
    var pointerX = 0, pointerY = 0, active = false;
    var lastInput = performance.now();
    var running = false, inView = true, prevTime = performance.now(), rafId = 0;

    /* ---------- 循环取模：让首尾相接，转不到头 ---------- */
    function nearest() { return ((Math.round(phase) % count) + count) % count; }

    function wrappedDelta(index, p) {
      var d = index - p;
      while (d > count / 2) d -= count;
      while (d < -count / 2) d += count;
      return d;
    }

    /* 把某张卡拉到正中：走最短方向，不做倒退一圈。
       锚点必须用 base（逻辑位置，恒为整数）而不是 phase ——
       phase 是动画中的中间值，一场点击里 focus 和 click 会各调一次 moveTo，
       拿 phase 当锚点会把同一段位移累加两次，卡片一下子冲过好几张。 */
    function moveTo(index) {
      var from = ((base % count) + count) % count;
      var d = index - from;
      if (d > count / 2) d -= count;
      if (d < -count / 2) d += count;
      base += d;
      target = base;
      active = false;
      lastInput = performance.now();
    }

    /* ---------- 交互 ---------- */
    cards.forEach(function (card, index) {
      card.addEventListener("click", function (e) {
        /* 已经在正中的那张 = "打开"，让它走链接去作品集；
           侧面的一律先归位，避免用户以为点不动 */
        if (index === nearest()) return;
        e.preventDefault();
        moveTo(index);
      });
      card.addEventListener("focus", function () { moveTo(index); });
    });

    stage.addEventListener("pointermove", function (e) {
      var rect = stage.getBoundingClientRect();
      pointerX = clamp(((e.clientX - rect.left) / rect.width - 0.5) * 2);
      pointerY = clamp(((e.clientY - rect.top) / rect.height - 0.5) * 2);
      active = true;
      /* 横向队列 → 横向散开。手机上 touch-action:pan-y 已经把手势让给了页面滚动，
         只有横向拖拽才留在我们手里，正好对应"横向散开"这件事。 */
      target = base + pointerX * 3.1;
      lastInput = performance.now();
    }, { passive: true });

    stage.addEventListener("pointerleave", function () {
      active = false;
      pointerX = 0;
      pointerY = 0;
      target = base;
    });

    if (useWheel) {
      stage.addEventListener("wheel", function (e) {
        e.preventDefault();
        var dir = Math.sign(Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
        if (!dir) return;
        base += dir;
        target = base;
        active = false;
        lastInput = performance.now();
      }, { passive: false });
    }

    /* 只在长廊内部有焦点时接管方向键 —— 页面别处按方向键仍然滚动 */
    stage.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
      var back = e.key === "ArrowLeft" || e.key === "ArrowUp";
      if (!fwd && !back) return;
      e.preventDefault();
      base += fwd ? 1 : -1;
      target = base;
      active = false;
      lastInput = performance.now();
    });

    /* ---------- 每帧排位 ---------- */
    function layout(time) {
      var speed = readSpeed();
      var dt = Math.min(32, time - prevTime) * speed;
      prevTime = time;
      var ease = reduced ? 1 : 1 - Math.pow(0.001, dt / 1000);

      stage.style.setProperty("--fc-scale", String(readScale()));

      if (useIdle && !reduced && !active && time - lastInput > 3600) {
        target = base + Math.sin((time - lastInput - 3600) * speed * 0.00042) * 2.45;
      }

      phase += (target - phase) * ease;

      var compact = compactMq.matches;
      var activeIndex = nearest();
      /* 手机上也保持横向队列。
         原作在 <650px 会切成一列纵向排布 —— 但纵向队列要同时占掉
         「中心卡整高 + 两侧各一张」的高度，390×574 的长廊根本装不下：
         实测相邻那两张有 90% 被中心卡盖住，再远一点的直接被长廊裁掉，
         看起来像一堆没排好的卡片。改成横向后间距按视口收窄，390 宽正好排下 5 张，
         而且插画不会被压成一条缝。 */
      var hSpacing = compact
        ? Math.min(124, Math.max(84, window.innerWidth * 0.30))
        : Math.min(168, Math.max(112, window.innerWidth * 0.116));

      for (var i = 0; i < count; i++) {
        var card = cards[i];
        var c = cache[i];
        var delta = wrappedDelta(i, phase);
        var distance = Math.abs(delta);
        var focus = Math.exp(-distance * distance * 1.28);
        var side = Math.max(0, 1 - distance / 5);
        var direction = Math.sign(delta);

        var x = delta * hSpacing;
        var y = distance * (compact ? 5 : 8) + pointerY * focus * 10;
        var z = focus * 145 - distance * 148;
        var sc = 0.54 + side * 0.15 + focus * 0.54;
        var rotX = -pointerY * focus * 3.5;
        var rotY = -direction * (distance > 0.2 ? 14 + Math.min(distance, 3) * 5 : 0) + pointerX * focus * 3;
        var rotZ = delta * 0.7;

        var f = focus.toFixed(4);
        if (c.f !== f) { card.style.setProperty("--focus", f); c.f = f; }

        /* 贴近舞台两端就淡出到 0，别让卡被硬生生切成一条竖线。
           判定用"卡的外缘越过边界多少"：只要开始被切就按切线占自身半宽的比例淡出，
           切掉 0.6 个半宽时正好归零 —— 过渡区约 20px（手机）/ 30px（桌面），
           既看不见刀口，也不会把正常的相邻卡压暗。
           顺带去掉了原作 0.13 的透明度下限：那个下限会让远处的卡永远留一层影子，
           在边界上就表现成一条慢慢滑动的彩色细线。 */
        var proj = geom.persp / (geom.persp - z);
        var halfW = geom.cardW * sc * proj / 2;
        var cut = Math.abs(x) * proj + halfW - geom.half;
        var edge = (geom.half > 0 && cut > 0) ? Math.max(0, 1 - cut / (halfW * 0.6)) : 1;
        /* 中段必须是不透明的：卡与卡本来就是相互叠压的，
           半透明的矩形互叠会糊成一块块脏色，而且每张的边缘都变成一道突兀的竖线 ——
           看起来就像两端被切断了。所以改成「中段实心、临出画才淡出」：
           不透明错落叠着才像一叠画，只有最外侧那 1~2 张才渐隐。
           远近感交给缩放、进深、角度和投影，不再靠透明度。 */
        var fade = Math.max(0, Math.min(1, (FILMSTRIP_BAND - distance) / 1.4));
        var opacity = String(fade * edge);
        if (c.o !== opacity) { card.style.opacity = opacity; c.o = opacity; }

        /* 已经淡到看不见的卡就别再接收点击了，免得点到一片空白 */
        var pe = edge < 0.15 ? "none" : "";
        if (c.p !== pe) { card.style.pointerEvents = pe; c.p = pe; }

        /* 远处才模糊，近处完全不挂 blur 图层（模糊是这里最贵的一项） */
        var blur = Math.max(0, distance - 1.5) * 0.38;
        if (c.b !== blur) {
          card.style.filter = blur < 0.06 ? "" : "blur(" + blur.toFixed(2) + "px)";
          c.b = blur;
        }

        var zi = String(Math.round(1000 - distance * 100));
        if (c.z !== zi) { card.style.zIndex = zi; c.z = zi; }

        var tf = "translate(-50%, -50%)" +
          " translate3d(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px, " + z.toFixed(2) + "px)" +
          " rotateX(" + rotX.toFixed(2) + "deg)" +
          " rotateY(" + rotY.toFixed(2) + "deg)" +
          " rotateZ(" + rotZ.toFixed(2) + "deg)" +
          " scale(" + sc.toFixed(4) + ")";
        if (c.t !== tf) { card.style.transform = tf; c.t = tf; }

        var isActive = i === activeIndex;
        if (c.a !== isActive) {
          card.setAttribute("aria-current", isActive ? "true" : "false");
          card.tabIndex = isActive ? 0 : -1;
          c.a = isActive;
        }
      }
    }

    function frame(time) {
      layout(time);
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      prevTime = performance.now();
      /* 重新进场时重置漂移相位，否则会从上次的相位里"跳"一下 */
      lastInput = prevTime;
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(rafId);
    }

    function sync() { if (inView && !document.hidden) start(); else stop(); }

    /* 先挂牌再量几何 —— 没挂牌时卡片还在兜底的 flex 队列里，量到的宽度不是最终值 */
    stage.classList.add("is-live");
    readGeom();
    layout(performance.now());

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0] ? entries[0].isIntersecting : true;
        sync();
      }, { rootMargin: "140px" }).observe(stage);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", sync);

    /* 窗口尺寸一变（含 <650px 断点切换），透视距离和卡宽都会变，几何要重新量 */
    var resizePending = false;
    window.addEventListener("resize", function () {
      if (resizePending) return;
      resizePending = true;
      window.requestAnimationFrame(function () {
        resizePending = false;
        readGeom();
        layout(performance.now());
      });
    }, { passive: true });
  }
})(window, document);
