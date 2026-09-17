/* ============================================================
   手绘星星装饰层（首页 Hero）
   ------------------------------------------------------------
   · 只有一颗小朋友手绘的小星星，锚定在「童话」的「话」字正上方
   · 描边为柔和灰；伪 3D：与标题 .plate 共用 --mx/--my/--tilt 视差
   · 点击：绕「把世界画成童话」标题转一圈。轨道是一条闭合平滑曲线，
     且正好穿过星星的静止位 —— 起点与终点是同一个点，切线连续，不会折一下；
     飞行前后会冻结 / 恢复弹跳动画的相位，所以星星落回原处后接着弹，不跳位
   · 白色渐变尾迹随移动速度变长变浓；尊重 prefers-reduced-motion
   · <=720px 隐藏；无第三方依赖
   ============================================================ */
(function (window, document) {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero) return;

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var NS = "http://www.w3.org/2000/svg";

  var EDGE = "#A79B8E";                            /* 柔和灰描边 */
  var PAPER = ["#FFFDF7", "#E8E0D0", "#F4EEE2"];   /* 纸白：浅面 / 折面 / 中间面 */

  /* 彩虹航迹色序 —— 与 assets/js/main.js 光标拖尾 TRAIL_COLORS 一致 */
  var TRAIL_COLORS = ["#FF8A4C", "#5FCBF2", "#97D64F", "#FFCE2E", "#FF9AA8", "#AC93F0"];

  /* 造型：2 = 侧视掠翼（viewBox 24x24，机头朝右 +x）
            5 = 千纸鹤（viewBox 24x24，头喙朝右 +x）
            6 = 手绘星星（viewBox 24x24） */
  var VARIANT = 6;

  /* 层级：飞机恒在最前（消失的只有轨迹） */
  var FRONT_Z = 3;

  /* ---------- 唯一机位 ----------
     anchor 锚定模式下：把星星挂在页面上某个真实元素的正上方 —— 这样无论窗口多宽，
       「话」字上方永远是「话」字上方（用 hero 宽度的百分比会因为
       clamp() 排版不成比例而漂移，实测 ±18px）。
       anchor 选择器 / ax 沿锚点宽度的比例（0.71 正好落在「话」字中心）
       gap 星星墨迹最低点到锚点顶边的距离(px)
     x/y 为兜底用的 hero 归一化坐标（锚点找不到时才用；rot 为星星角度；
     tz/pf 为伪 3D 景深与视差幅度） */
  var SPOTS = [
    /* liftBy = 2/3（上移星星高度的三分之二）再减 1/5（下移五分之一）= 7/15 */
    { anchor: '.hero-title .plate:nth-child(3)', ax: 0.85, gap: 0, liftBy: 7 / 15,
      x: 0.40, y: 0.305, s: 92, rot: -10, tz: 34, pf: 10 }
  ];

  var VARIANTS = {
    1: function (c) { /* 经典飞镖 */
      return '<polygon points="23 12 2 3 9 12 2 21" fill="' + c[0] + '"/>'
           + '<polygon points="23 12 9 12 2 21" fill="' + c[1] + '"/>'
           + '<polygon points="23 12 2 3 9 12 2 21" fill="none" stroke="' + EDGE + '" stroke-width="1.7" stroke-linejoin="round"/>'
           + '<line x1="23" y1="12" x2="9" y2="12" stroke="' + EDGE + '" stroke-width="1.4" stroke-linecap="round"/>';
    },
    2: function (c) { /* 手绘毛躁风：抖动线条 + 双线叠画 + 噪声位移，才有手画的"毛边" */
      return '<defs><filter id="yzRough" x="-30%" y="-30%" width="160%" height="160%">'
           + '<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="3" result="n"/>'
           + '<feDisplacementMap in="SourceGraphic" in2="n" scale="0.7"'
           + ' xChannelSelector="R" yChannelSelector="G"/>'
           + '</filter></defs>'
           + '<g filter="url(#yzRough)">'
           + '<path d="' + handPath(OUT_PTS, 11, 0.6, true) + '" fill="' + c[0] + '"'
           + ' stroke="' + EDGE + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>'
           + '<path d="' + handPath(OUT_PTS, 137, 0.95, true) + '" fill="none"'
           + ' stroke="' + EDGE + '" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/>'
           + '<path d="' + handPath(FOLD_PTS, 29, 0.5, false) + '" fill="none"'
           + ' stroke="' + EDGE + '" stroke-width="1.3" stroke-linecap="round"/>'
           + '<path d="' + handPath(KEEL_PTS, 53, 0.55, true) + '" fill="' + c[2] + '"'
           + ' stroke="' + EDGE + '" stroke-width="1.3" stroke-linejoin="round"/>'
           + '</g>';
    },
    3: function (c) { /* 折纸三段 */
      return '<polygon points="23 12 2 4 13 10" fill="' + c[0] + '"/>'
           + '<polygon points="23 12 13 10 13 15" fill="' + c[2] + '"/>'
           + '<polygon points="23 12 13 15 5 20" fill="' + c[1] + '"/>'
           + '<polygon points="23 12 2 4 13 10 13 15 5 20" fill="none" stroke="' + EDGE + '" stroke-width="1.7" stroke-linejoin="round"/>'
           + '<line x1="23" y1="12" x2="13" y2="10" stroke="' + EDGE + '" stroke-width="1.4" stroke-linecap="round"/>'
           + '<line x1="23" y1="12" x2="13" y2="15" stroke="' + EDGE + '" stroke-width="1.4" stroke-linecap="round"/>';
    },
    4: function (c) { /* 修长滑翔 */
      return '<polygon points="23 12 1 7 11 12 1 17" fill="' + c[0] + '"/>'
           + '<polygon points="23 12 11 12 1 17" fill="' + c[1] + '"/>'
           + '<polygon points="23 12 1 7 11 12 1 17" fill="none" stroke="' + EDGE + '" stroke-width="1.6" stroke-linejoin="round"/>'
           + '<line x1="23" y1="12" x2="11" y2="12" stroke="' + EDGE + '" stroke-width="1.3" stroke-linecap="round"/>';
           },
           5: function (c) { /* 千纸鹤：多面折纸，沿用同一套毛躁手绘线条 */
           var parts = [
             { p: CRANE.wingFar,  f: c[1], w: 1.25 },   /* 远翼（身后，先画） */
             { p: CRANE.tail,     f: c[1], w: 1.25 },   /* 尾（朝左） */
             { p: CRANE.neck,     f: c[2], w: 1.25 },   /* 颈 */
             { p: CRANE.body,     f: c[2], w: 1.30 },   /* 身（向下收尖） */
             { p: CRANE.wingNear, f: c[0], w: 1.40 },   /* 近翼（最大，压在最前） */
             { p: CRANE.head,     f: c[0], w: 1.25 }    /* 头喙（朝右） */
           ], i, s =
             '<defs><filter id="yzRough" x="-30%" y="-30%" width="160%" height="160%">'
           + '<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="3" result="n"/>'
           + '<feDisplacementMap in="SourceGraphic" in2="n" scale="0.7"'
           + ' xChannelSelector="R" yChannelSelector="G"/>'
           + '</filter></defs>'
           + '<g filter="url(#yzRough)">';
           for (i = 0; i < parts.length; i++) {
             var pt = parts[i];
             s += '<path d="' + handPath(pt.p, 11 + i * 17, 0.55, true) + '" fill="' + pt.f + '"'
                + ' stroke="' + EDGE + '" stroke-width="' + pt.w + '" stroke-linejoin="round" stroke-linecap="round"/>';
             /* 二次描线：错开种子再描一遍，得到手画的"毛边" */
             s += '<path d="' + handPath(pt.p, 200 + i * 23, 0.9, true) + '" fill="none"'
                + ' stroke="' + EDGE + '" stroke-width="' + (pt.w * 0.75).toFixed(2) + '"'
                + ' stroke-linejoin="round" stroke-linecap="round" opacity=".5"/>';
           }
           for (i = 0; i < CRANE_FOLDS.length; i++) {
             s += '<path d="' + handPath(CRANE_FOLDS[i], 29 + i * 13, 0.5, false) + '" fill="none"'
                + ' stroke="' + EDGE + '" stroke-width="1.2" stroke-linecap="round"/>';
           }
           return s + '</g>';
           },
           6: function (c) { /* 小朋友画的小星星：臂长短不一 + 尖角倒圆 + 边微弓 + 手抖的多遍描边 */
           return '<defs><filter id="yzRough" x="-38%" y="-38%" width="176%" height="176%">'
                + '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" result="n"/>'
                + '<feDisplacementMap in="SourceGraphic" in2="n" scale="0.55"'
                + ' xChannelSelector="R" yChannelSelector="G"/>'
                + '</filter></defs>'
                + '<g filter="url(#yzRough)">'
                /* 第一遍：主轮廓（唯一有填充的一遍） */
                + '<path d="' + handPathCurve(STAR_PTS, 11, 0.75, 0.5, 2.2, true, 0.3) + '" fill="' + c[0] + '"'
                + ' stroke="' + EDGE + '" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>'
                /* 第二遍：整圈重描，走线、弓度、倒圆都不一样 —— 两条线时交时离，手画感主要来自这里 */
                + '<path d="' + handPathCurve(STAR_PTS, 137, 1.275, 0.8, 3.3, true, 0.3) + '" fill="none"'
                + ' stroke="' + EDGE + '" stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round" opacity=".42"/>'
                /* 第三遍：只补两三个角，像收笔时又顺手画了一下 */
                + '<path d="' + handPathCurve(STAR_PTS.slice(0, 5), 61, 1.35, 0.65, 2.2, false, 0.3) + '" fill="none"'
                + ' stroke="' + EDGE + '" stroke-width="0.7" stroke-linejoin="round" stroke-linecap="round" opacity=".28"/>'
                + '</g>';
           }
           };

  /* ---------- 手绘毛躁线条 ---------- */
  /* 确定性伪随机（固定种子 → 每次渲染形状一致，不会闪） */
  function jitterPRNG(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }

  /* 折线点做抖动 + 中点平滑，得到"手画出来"的弯弯曲曲的线 */
  function handPath(pts, seed, amp, close) {
    var rnd = jitterPRNG(seed), j = [], i;
    for (i = 0; i < pts.length; i++) {
      j.push([pts[i][0] + (rnd() - 0.5) * amp, pts[i][1] + (rnd() - 0.5) * amp]);
    }
    var d = "M" + j[0][0].toFixed(2) + " " + j[0][1].toFixed(2);
    for (i = 1; i < j.length - 1; i++) {
      var mx = (j[i][0] + j[i + 1][0]) / 2, my = (j[i][1] + j[i + 1][1]) / 2;
      d += " Q" + j[i][0].toFixed(2) + " " + j[i][1].toFixed(2)
        + " " + mx.toFixed(2) + " " + my.toFixed(2);
    }
    var last = j[j.length - 1];
    d += " L" + last[0].toFixed(2) + " " + last[1].toFixed(2);
    if (close) d += " Z";
    return d;
  }

  /* 手绘曲线路径。三件事一起做，线条才不像矢量图：
     ① amp  顶点抖动 —— 手不会落在精确坐标上
     ② round 尖角倒圆 —— 小朋友不会画出刀尖一样的角，转折处会自然带成一小段弧
     ③ bow  边微弓 —— 一笔拉过去，边不会是直线
     三条幅度都逐角 / 逐边取不同值（同一颗星里有的圆得多、有的弓得明显），
     整体才有"手画"的不均匀感。

     关键：倒圆要区别对待 —— 星尖（离星心远的角）多倒，内凹（离星心近的角）少倒。
     两边一视同仁地倒圆会把内凹填平，五个角就糊成一个胖五边形，不再像星星了。
     notchW 就是内凹角的倒圆权重（越小平分越"尖"，星形越清楚）。 */
  function handPathCurve(pts, seed, amp, bow, round, close, notchW) {
    var rnd = jitterPRNG(seed), j = [], i;
    for (i = 0; i < pts.length; i++) {
      j.push([pts[i][0] + (rnd() - 0.5) * amp, pts[i][1] + (rnd() - 0.5) * amp]);
    }
    var n = j.length;

    /* 从 from 朝 to 走 dist 距离的点 */
    function toward(from, to, dist) {
      var vx = to[0] - from[0], vy = to[1] - from[1];
      var L = Math.sqrt(vx * vx + vy * vy) || 1;
      var k = Math.min(dist, L * 0.4);        /* 别把整条边吃光 */
      return [from[0] + vx / L * k, from[1] + vy / L * k];
    }
    function distC(p) {
      var dx = p[0] - STAR_C[0], dy = p[1] - STAR_C[1];
      return Math.sqrt(dx * dx + dy * dy);
    }

    /* 每个角拆成 入点 / 顶点 / 出点：入点到出点用顶点当控制点画弧 = 倒圆 */
    var C = [];
    for (i = 0; i < n; i++) {
      var pv = j[(i - 1 + n) % n], cu = j[i], nx = j[(i + 1) % n];
      /* 比两边都离星心远 → 这是星尖，畅快地倒圆；否则是内凹，收着倒 */
      var tip = distC(cu) >= (distC(pv) + distC(nx)) / 2;
      var rr = round * (tip ? 1 : (notchW == null ? 0.3 : notchW)) * (0.6 + rnd() * 0.8);
      C.push({
        in: toward(cu, pv, rr),
        at: cu,
        out: toward(cu, nx, rr)
      });
    }

    /* 两个角之间的一段边：朝"星心向外"微微弓起 */
    function edge(a, b) {
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var ox = mx - STAR_C[0], oy = my - STAR_C[1];
      var ol = Math.sqrt(ox * ox + oy * oy) || 1;
      var k = bow * (0.45 + rnd() * 0.9);     /* 每条边的弓度都不一样 */
      return " Q" + (mx + ox / ol * k).toFixed(2) + " " + (my + oy / ol * k).toFixed(2)
           + " " + b[0].toFixed(2) + " " + b[1].toFixed(2);
    }
    function corner(c) {
      return " Q" + c.at[0].toFixed(2) + " " + c.at[1].toFixed(2)
           + " " + c.out[0].toFixed(2) + " " + c.out[1].toFixed(2);
    }

    var total = close ? n : n - 1;
    var start = close ? C[0].out : j[0];
    var d = "M" + start[0].toFixed(2) + " " + start[1].toFixed(2);
    for (i = 1; i <= total; i++) {
      var idx = i % n;
      var a = (i === 1 && !close) ? j[0] : C[(idx + n - 1) % n].out;
      d += edge(a, C[idx].in);
      if (close || i < n - 1) d += corner(C[idx]);
      else d += " L" + j[n - 1][0].toFixed(2) + " " + j[n - 1][1].toFixed(2);
    }
    if (close) d += " Z";
    return d;
  }

  /* 纸飞机的骨架点（24x24，机头朝右） */
  var OUT_PTS = [
    [23, 11], [16.5, 7.4], [10, 4.6], [2, 3],            /* 机头 → 上翼尖 */
    [4.4, 7.2], [6.8, 9.8], [9, 12],                      /* 上翼尖 → 尾中 */
    [6.6, 14.8], [4.4, 17], [3, 19],                      /* 尾中 → 下翼尖 */
    [9.5, 17], [15, 15], [20, 12.8]                       /* 下翼尖 → 机头 */
  ];
  var FOLD_PTS = [[23, 11], [18, 11.2], [13, 11.6], [9, 12]];
  var KEEL_PTS = [[9, 12], [13.2, 15.6], [8.6, 16.9]];

  /* 千纸鹤的骨架点（24x24，头喙朝右 +x）
     双翅共用身体上缘为底、向上张开成 V；尾朝左；颈连身与头；身向下收尖 */
  var CRANE = {
    wingFar:  [[14.2, 12.0], [17.2, 3.4], [9.8, 13.2]],
    wingNear: [[13.6, 12.2], [8.4, 1.6], [9.2, 13.4]],
    tail:     [[10.6, 12.6], [1.4, 10.0], [10.0, 15.0]],
    neck:     [[13.4, 12.4], [17.2, 10.2], [19.0, 8.6],
               [18.8, 10.0], [16.2, 12.0], [12.6, 14.0]],
    body:     [[13.4, 12.6], [15.0, 15.8], [12.2, 20.4], [10.0, 15.2]],
    head:     [[19.0, 8.6], [20.2, 7.2], [23.6, 8.8], [19.0, 10.0]]
  };
  var CRANE_FOLDS = [
    [[12.6, 13.4], [12.2, 19.6]],   /* 身体中缝 */
    [[11.4, 12.8], [8.6, 4.0]]      /* 近翼折痕 */
  ];

  /* 小朋友画的星星 —— 关键不是"标准五角星"，而是"不规整"：
     ① 五个角伸出的长度各不相同（有的长有的短）
     ② 内凹的深浅也各不相同（有的角胖有的角瘦）
     ③ 五个角的方向并不均匀分布（手画时不会量角度）
     ④ 星星整体略偏离正中，天然带一点歪
     数据全部写死（而非随机），保证每次渲染形状一致、不会闪。 */
  var STAR_C = [11.8, 12.0];   /* 星星的中心（viewBox 单位）—— 描边弓向"外侧"时以它为基准 */
  var STAR_PTS = (function () {
    var R  = [10.5, 9.2, 10.4, 9.1, 10.1];  /* 每个外角伸多远：长短明显不一样 */
    var r  = [5.3, 4.7, 5.4, 4.6, 5.2];     /* 每个内凹有多深：凹得够深，五个角才立得住 */
    var aO = [89, 164, 229, 308, 14];       /* 外角方向（度，0=右，逆时针）：不是均匀的 72° */
    var aI = [123, 200, 265, 339, 50];      /* 内凹方向：大致在相邻两角中间，但各有偏移 */
    var cx = STAR_C[0], cy = STAR_C[1], D = Math.PI / 180, p = [], i, pt;
    pt = function (rad, a) {
      return [cx + rad * Math.cos(a * D), cy - rad * Math.sin(a * D)];
    };
    for (i = 0; i < R.length; i++) { p.push(pt(R[i], aO[i])); p.push(pt(r[i], aI[i])); }
    return p;
  })();

  function planeMarkup() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + VARIANTS[VARIANT](PAPER) + '</svg>';
  }

  /* ---------- 图层搭建 ---------- */
  var layer = document.createElement("div");
  layer.className = "flight-layer";
  layer.setAttribute("aria-hidden", "true");
  var planes = [];

  /* ---------- 落位 ----------
     星星的墨迹（SVG path）在元素盒里并非居中：它比盒中心略偏上、偏右
     （因为 viewBox 里的星形自身不对称，且整体转了 rot 度）。
     定位前先把这份偏移量量出来，才能让"墨迹最低点"精确停在目标位置。
     量的时候要临时停掉弹跳动画和鼠标视差，否则量到的是它在半空中的位置。 */
  function inkMetrics(el, rot) {
    var d3 = el.querySelector(".plane-3d");
    var pin = el.querySelector(".plane-in");
    var path = el.querySelector("svg path");
    if (!path) return { dx: 0, dy: 0, hh: 0 };
    /* 跟随鼠标的视差要清零，但 translateZ 的透视放大必须留着 ——
       否则量到的是"没放大"的尺寸，星星会落得偏高 */
    var keepMx = d3 ? d3.style.getPropertyValue("--mx") : "";
    var keepMy = d3 ? d3.style.getPropertyValue("--my") : "";
    var keepAn = pin ? pin.style.animation : "";
    var keepTf = pin ? pin.style.transform : "";
    if (d3) { d3.style.setProperty("--mx", "0"); d3.style.setProperty("--my", "0"); }
    /* 关键：旋转写在 keyframes 的静止姿态里，
       只关 animation 会让星星"没转过"，量出的包围盒会明显偏小 → 落位偏高、压到标题。
       所以关动画的同时要把 rot 手动补回去。 */
    if (pin) {
      pin.style.animation = "none";
      pin.style.transform = "rotate(" + (rot || 0) + "deg)";
    }
    void el.offsetWidth;
    var er = el.getBoundingClientRect();
    var pr = path.getBoundingClientRect();
    if (d3) {
      if (keepMx) d3.style.setProperty("--mx", keepMx); else d3.style.removeProperty("--mx");
      if (keepMy) d3.style.setProperty("--my", keepMy); else d3.style.removeProperty("--my");
    }
    if (pin) { pin.style.animation = keepAn; pin.style.transform = keepTf; }
    return {
      dx: (pr.left + pr.width / 2) - (er.left + er.width / 2),
      dy: (pr.top + pr.height / 2) - (er.top + er.height / 2),
      hh: pr.height / 2
    };
  }

  /* 算出星星元素中心的 left / top（相对 flight-layer，也就是 hero） */
  function spotPos(sp, el) {
    var m = inkMetrics(el, sp.rot);
    if (sp.anchor) {
      var t = document.querySelector(sp.anchor);
      if (t) {
        var lr = layer.getBoundingClientRect();
        var tr = t.getBoundingClientRect();
        /* 目标：墨迹中心横坐标 = 锚点宽度 ax 处；墨迹最低点 = 锚点顶边往上（gap + 额外抬升） */
        var inkCx = (tr.left - lr.left) + tr.width * (sp.ax == null ? 0.5 : sp.ax);
        /* liftBy 是"以星星自身高度为单位"的额外抬升量（2/3 就是向上挪星星高度的三分之二）。
           用比例而不是写死像素：以后改星星尺寸或旋转角，抬升量会自动跟着走 */
        var lift = sp.liftBy ? sp.liftBy * m.hh * 2 : 0;
        var inkCy = (tr.top - lr.top) - (sp.gap || 0) - lift - m.hh;
        return { x: inkCx - m.dx, y: inkCy - m.dy };
      }
    }
    return { x: sp.x * hero.clientWidth, y: sp.y * hero.clientHeight };
  }

  function build() {
    planes.forEach(function (p) { if (p.el.parentNode) p.el.parentNode.removeChild(p.el); });
    planes.length = 0;

    for (var i = 0; i < SPOTS.length; i++) {
      var sp = SPOTS[i];
      var el = document.createElement("button");
      el.type = "button";
      el.className = "plane";
      el.setAttribute("data-track", "hero_star_click");
      el.setAttribute("aria-label", "星星装饰：点我绕标题转一圈");
      el.style.width = sp.s + "px";
      el.style.height = sp.s + "px";
      el.style.zIndex = FRONT_Z;
      el.innerHTML =
        '<span class="plane-3d" style="--tz:' + sp.tz + 'px;--pf:' + sp.pf + 'px">'
        + '<span class="plane-in" style="--pr:' + sp.rot + 'deg;--bob-d:3.2s;--bob-delay:0s">'
        + planeMarkup() + "</span></span>";

      /* 先挂进 DOM（墨迹偏移要量真实渲染结果），再落位 */
      layer.appendChild(el);
      var p = spotPos(sp, el);
      el.style.left = p.x.toFixed(1) + "px";
      el.style.top = p.y.toFixed(1) + "px";

      (function (idx) {
        el.addEventListener("click", function () { fly(idx); });
      })(i);
      planes.push({ el: el, busy: false });
    }
  }

  /* ---------- 轨道飞行 ---------- */
  /* 覆盖层放进 flight-layer 内（而不是 body），
     这样飞机的 z-index 能在「标题前 / 标题后」之间切换 */
  var overlay = null, defs = null, gradSeq = 0, starry = null;

  function ensureOverlay() {
    if (!overlay) {
      overlay = document.createElementNS(NS, "svg");
      overlay.setAttribute("class", "fly-overlay");
      defs = document.createElementNS(NS, "defs");
      overlay.appendChild(defs);
      layer.appendChild(overlay);
    }
    overlay.setAttribute("viewBox", "0 0 " + hero.clientWidth + " " + hero.clientHeight);
    return overlay;
  }

  /* 点击期间整屏变暗的星空背景：挂在 body 级、z-index:0，
     退到 main 内容之后当底色，文字与作品因此悬浮其上 */

  /* ---------- 夜空：一张"画"出来的主观星夜 ----------
     不再用多层径向渐变拼底（那正是屏幕拼接感的来源），而是按构图铺色：
     左下暗部压住画面、右上暖光作为唯一出口、对角笔势由暗向亮贯穿；
     最后叠印刷复刻的套色微偏移与纸面颗粒 + 暗角，让它像一张印刷品而非屏幕。
     半分辨率绘制再放大 → 边缘更软，更像颜料而不是矢量。 */
  var SKY_SCALE = 0.5;
  var skyCv = null, skyTimer = null;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function paintSky() {
    if (!skyCv) return;
    var W = Math.max(1, Math.round(window.innerWidth * SKY_SCALE));
    var H = Math.max(1, Math.round(window.innerHeight * SKY_SCALE));
    if (skyCv.width !== W || skyCv.height !== H) { skyCv.width = W; skyCv.height = H; }
    var c = skyCv.getContext("2d");
    if (!c) return;
    var rnd = mulberry32(20260909);

    /* 纯净夜空：深靛蓝中心 → 近黑边缘的柔和径向渐变。
       去掉所有色彩色块与印刷脏感细节，画面只剩"深空 + 呼吸的星" */
    var bg = c.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    bg.addColorStop(0, "#172050");
    bg.addColorStop(1, "#070a1a");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    /* 极轻颗粒：只为消除渐变断层，不影响纯净感（振幅从 15 降到 6） */
    var img = null, i, n;
    try { img = c.getImageData(0, 0, W, H); } catch (e) { img = null; }
    if (img) {
      var d = img.data;
      for (i = 0; i < d.length; i += 4) {
        n = (rnd() - 0.5) * 6;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      c.putImageData(img, 0, 0);
    }

    /* 轻微暗角：给深空一点纵深，但很克制 */
    var vg = c.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.30,
      W * 0.5, H * 0.5, Math.max(W, H) * 0.80);
    vg.addColorStop(0, "rgba(6,8,20,0)");
    vg.addColorStop(1, "rgba(6,8,20,0.38)");
    c.fillStyle = vg;
    c.fillRect(0, 0, W, H);

  }

  window.addEventListener("resize", function () {
    if (!starry) return;
    if (skyTimer) clearTimeout(skyTimer);
    skyTimer = setTimeout(paintSky, 200);
  });

  function ensureStarry() {
    if (starry) return starry;
    starry = document.createElement("div");
    starry.className = "starry-sky";
    skyCv = document.createElement("canvas");
    skyCv.className = "starry-paint";
    starry.appendChild(skyCv);              /* 先于星点 → 星点压在夜空之上 */
    paintSky();
    var N = 150, frag = document.createDocumentFragment(), i, s, sz, dur, big;
    for (i = 0; i < N; i++) {
      s = document.createElement("i");
      big = (i % 12 === 0);
      if (big) {                                /* 少量大星，带光晕 */
        s.className = "big";
        sz = (3 + Math.random() * 3.4).toFixed(2);
        dur = 1.3 + Math.random() * 2.2;
      } else {
        /* 三档幅度随机取，不再按顺序轮流 —— 深浅完全打散 */
        s.className = "tk" + Math.floor(Math.random() * 3);
        /* 大小走幂律：绝大多数极细小，少数明显偏亮 —— 不规则，接近真实星野 */
        sz = (0.5 + Math.pow(Math.random(), 2.0) * 4.2).toFixed(2);
        dur = 0.8 + Math.pow(Math.random(), 1.5) * 2.4;
      }
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.top = (Math.random() * 100).toFixed(2) + "%";
      s.style.width = sz + "px";
      s.style.height = sz + "px";
      s.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
      s.style.animationDelay = (Math.random() * 2.4).toFixed(2) + "s";
      /* 每颗星一个自己的周期（整体比原来快一倍以上），快慢毫无规律 */
      s.style.animationDuration = dur.toFixed(2) + "s";
      frag.appendChild(s);
    }
    starry.appendChild(frag);
    document.body.appendChild(starry);
    return starry;
  }

  /* 沿路径包围盒铺一条彩虹渐变（与鼠标光标拖尾同色序） */
  function rainbowGradient(pathEl) {
    var bb;
    try { bb = pathEl.getBBox(); } catch (e) { bb = null; }
    var id = "planeTrailGrad" + (++gradSeq);
    var g = document.createElementNS(NS, "linearGradient");
    g.setAttribute("id", id);
    g.setAttribute("gradientUnits", "userSpaceOnUse");
    if (bb && bb.width > 1) {
      g.setAttribute("x1", bb.x.toFixed(1));
      g.setAttribute("y1", bb.y.toFixed(1));
      g.setAttribute("x2", (bb.x + bb.width).toFixed(1));
      g.setAttribute("y2", (bb.y + bb.height).toFixed(1));
    } else {
      g.setAttribute("x1", "0"); g.setAttribute("y1", "0");
      g.setAttribute("x2", "1"); g.setAttribute("y2", "1");
    }
    var cycles = 2, total = TRAIL_COLORS.length * cycles;
    for (var k = 0; k <= total; k++) {
      var st = document.createElementNS(NS, "stop");
      st.setAttribute("offset", (k / total * 100).toFixed(2) + "%");
      st.setAttribute("stop-color", TRAIL_COLORS[k % TRAIL_COLORS.length]);
      g.appendChild(st);
    }
    defs.appendChild(g);
    return "url(#" + id + ")";
  }

  /* 把一串点连成一条闭合的平滑曲线（Catmull-Rom 转三次贝塞尔）。
     好处：首尾天然相接、处处切线连续 —— 星星滑出去和滑回来不会"折一下" */
  function closedSmoothPath(pts) {
    var n = pts.length, i;
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i];
      var p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1)
         + " " + c2x.toFixed(1) + " " + c2y.toFixed(1)
         + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d + " Z";
  }

  /* 从 computed transform 里取出旋转角（度）。星星静止时除了基准角度（见 SPOTS.rot）
     还叠着弹跳动画的一点旋转，照实取出来，飞行首尾的朝向才接得上 */
  function matrixRot(el) {
    if (!el || !window.getComputedStyle) return null;
    var m = window.getComputedStyle(el).transform;
    if (!m || m === "none") return null;
    var v = /matrix\(([^)]+)\)/.exec(m);
    if (!v) return null;
    var p = v[1].split(",");
    var a = parseFloat(p[0]), b = parseFloat(p[1]);
    if (!isFinite(a) || !isFinite(b)) return null;
    return Math.atan2(b, a) * 180 / Math.PI;
  }

  /* 最短角差插值，避免角度跳变 */
  function angLerp(a, b, k) {
    var d = ((b - a + 540) % 360) - 180;
    return a + d * k;
  }

  function fly(i) {
    var rec = planes[i];
    if (!rec || rec.busy) return;
    rec.busy = true;
    var el = rec.el;

    if (reduced) { rec.busy = false; return; } /* 减少动态：不飞 */

    var hr = hero.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var size = r.width;
    var pin0 = el.querySelector(".plane-in");

    /* 起点取「此刻真实显示的位置」：先定住弹跳动画，再从星星实际的墨迹范围取中心。
       飞行结束时把动画恢复到同一相位，星星会接着从原处继续弹 ——
       起点与终点因此严格重合，不会往回跳一下。 */
    if (pin0) pin0.style.animationPlayState = "paused";
    var pr0 = el.querySelector("svg path");
    var ir0 = pr0 ? pr0.getBoundingClientRect() : r;
    var restX = ir0.left + ir0.width / 2 - hr.left;
    var restY = ir0.top + ir0.height / 2 - hr.top;
    /* 静止朝向照实取（弹跳里混着一点旋转），收尾才接得上 */
    var restRot = matrixRot(pin0);
    if (restRot == null) restRot = (SPOTS[i] && SPOTS[i].rot != null) ? SPOTS[i].rot : 0;

    /* 轨道中心 = 标题中心；半径 = 标题尺寸 + 余量 */
    var title = hero.querySelector(".hero-title");
    var cx, cy, rx, ry;
    if (title) {
      var t = title.getBoundingClientRect();
      cx = t.left + t.width / 2 - hr.left;
      cy = t.top + t.height / 2 - hr.top;
      /* 轨道以标题为中心，半径随星星尺寸自适应，保持环绕感 */
      rx = t.width / 2 + Math.max(28, size * 0.55);
      ry = t.height / 2 + Math.max(24, size * 0.48);
    } else {
      cx = restX; cy = restY - 120; rx = 240; ry = 120;
    }

    var svg = ensureOverlay();

    /* 闭合轨道：以标题为中心的椭圆，但要正好穿过星星的静止位 R。
       做法：以 R 的方向为零度，把半径沿 cos 曲线从 |OR|/|Oe| 平滑过渡回 1 ——
       曲线穿过 R，其余仍是完整的一圈椭圆。
       这样星星不用先"平移"到轨道上，整段飞行都贴在同一条闭合曲线上：
       起点和终点是同一个点，且处处切线连续，不会在接缝处折一下。 */
    var dxr = restX - cx, dyr = restY - cy;
    var a0 = Math.atan2(dyr / ry, dxr / rx);
    var kR = Math.sqrt((dxr / rx) * (dxr / rx) + (dyr / ry) * (dyr / ry));
    if (!isFinite(kR)) kR = 1;
    if (kR < 0.2) kR = 0.2;
    if (kR > 1.6) kR = 1.6;
    var LOOP_N = 26, loop = [], li, lraw, lphi, lw;
    for (li = 0; li < LOOP_N; li++) {
      lraw = li * (Math.PI * 2 / LOOP_N);
      lphi = lraw > Math.PI ? lraw - Math.PI * 2 : lraw;   /* 相对 R 的角度差 */
      /* li = 0 时 lw = kR → 该点正好落在 R 上 */
      lw = 1 - (1 - kR) * Math.pow(Math.max(0, Math.cos(lphi)), 1.5);
      loop.push([cx + rx * lw * Math.cos(a0 + lraw), cy + ry * lw * Math.sin(a0 + lraw)]);
    }
    var guide = document.createElementNS(NS, "path");
    guide.setAttribute("d", closedSmoothPath(loop));
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", "none");
    svg.appendChild(guide);
    var len = guide.getTotalLength();
    /* 拖尾：沿轨道采样的连续曲线 + 沿其方向「透明白→实白」渐变，
       形成无分段的彗星尾；柔和模糊让边缘发虚 */
    var trailBlurId = "planeTrailBlur" + (++gradSeq);
    var tBlur = document.createElementNS(NS, "filter");
    tBlur.setAttribute("id", trailBlurId);
    tBlur.setAttribute("x", "-40%"); tBlur.setAttribute("y", "-40%");
    tBlur.setAttribute("width", "180%"); tBlur.setAttribute("height", "180%");
    var tb = document.createElementNS(NS, "feGaussianBlur");
    tb.setAttribute("stdDeviation", "2.2");
    tBlur.appendChild(tb);
    defs.appendChild(tBlur);

    /* 沿尾迹方向渐变：尾端透明、机头实白（彻底消除分段感） */
    var trailGradId = "planeTrailGrad" + (++gradSeq);
    var trailGrad = document.createElementNS(NS, "linearGradient");
    trailGrad.setAttribute("id", trailGradId);
    trailGrad.setAttribute("gradientUnits", "userSpaceOnUse");
    [["0%", "0"], ["55%", "0.35"], ["100%", "0.95"]].forEach(function (s) {
      var st = document.createElementNS(NS, "stop");
      st.setAttribute("offset", s[0]);
      st.setAttribute("stop-color", "#ffffff");
      st.setAttribute("stop-opacity", s[1]);
      trailGrad.appendChild(st);
    });
    defs.appendChild(trailGrad);

    var trailW = 3.4;
    var trailPath = document.createElementNS(NS, "path");
    trailPath.setAttribute("class", "fly-trail");
    trailPath.setAttribute("fill", "none");
    trailPath.setAttribute("stroke", "url(#" + trailGradId + ")");
    trailPath.style.strokeWidth = trailW.toFixed(1) + "px";
    trailPath.setAttribute("stroke-linecap", "round");
    trailPath.setAttribute("stroke-linejoin", "round");
    trailPath.style.opacity = 0;
    var trailGroup = document.createElementNS(NS, "g");
    trailGroup.setAttribute("filter", "url(#" + trailBlurId + ")");
    trailGroup.appendChild(trailPath);
    svg.appendChild(trailGroup);

    /* 星体实际走过的位置历史：尾迹只画在这里，因此「没走过」就不会有尾迹 */
    var hist = [];

    /* 克隆一架执行绕飞：关掉视差与漂浮，避免叠加抖动；
       放在 flight-layer 内，才能切换「标题前 / 后」的层级 */
    el.style.visibility = "hidden";
    var flyEl = document.createElement("div");
    flyEl.className = "plane-fly";
    flyEl.style.position = "absolute";
    flyEl.style.width = size + "px";
    flyEl.style.height = size + "px";
    flyEl.innerHTML = el.innerHTML;
    /* 保留 translateZ 带来的透视放大（否则飞行中星星会比静止时小一圈），
       只把跟随鼠标的视差清零 —— 飞行轨迹要干净，不叠抖动 */
    var d3 = flyEl.querySelector(".plane-3d");
    if (d3) { d3.style.setProperty("--mx", "0"); d3.style.setProperty("--my", "0"); }
    /* 旋转交给外层 flyEl 统一控制，内层保持不转 */
    var pin = flyEl.querySelector(".plane-in");
    if (pin) { pin.style.animation = "none"; pin.style.transform = "none"; }
    /* 关键：div 不能塞进 <svg> 里 —— 浏览器不会渲染 SVG 内的 HTML 元素，
       这会让飞行中的飞机"消失"。必须挂到 HTML 容器，并锁定在最前层。 */
    flyEl.style.zIndex = FRONT_Z;
    layer.appendChild(flyEl);
    /* 星星墨迹相对元素盒中心的偏移（含旋转与透视放大）：
       轨道上取到的点是"墨迹中心"，落位时要减掉这份偏移 */
    var cm = inkMetrics(flyEl, restRot);

    /* 点击期间整屏变暗为星空背景；页面文字转浅色悬浮其中，星星变金黄 */
    var sky = ensureStarry();
    void sky.offsetWidth;            /* 触发初始 opacity:0，保证淡入过渡生效 */
    sky.classList.add("on");
    document.body.classList.add("starry-on");

    var dur = 4200;          /* 绕一整圈的时长 */
    var SCALE_AMP = 0.24;    /* 伪 3D 缩放幅度：近大远小 */
    var ROT_IN = 0.09;       /* 起步 / 收尾用来融合朝向的时间占比 */
    var start = null;
    var last = { x: 0, y: 0, t: 0, init: true };   /* 用于按帧位移推算移动速度 */
    function smooth(t) { return t * t * (3 - 2 * t); }

    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);

      /* 整条闭合轨道跑一遍：t = 0 与 t = 1 都落在星星原位，首尾严格同一个点。
         smooth 让起步和收尾都带减速感，不会"啪"地开始 / 停住 */
      var prog = smooth(t);
      var dist = len * prog;
      var p = guide.getPointAtLength(dist);
      var p2 = guide.getPointAtLength(dist + 8 >= len ? dist + 8 - len : dist + 8);
      var ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;

      /* 伪 3D：近大远小；星星始终在最前 */
      var depth = Math.max(-1, Math.min(1, (p.y - cy) / ry));   /* -1 最远 · +1 最近 */
      var scale = 1 + SCALE_AMP * depth;

      /* 朝向只在起步 / 收尾各一小段里与静止朝向融合，位置全程贴在轨道上 */
      var rotBlend = smooth(Math.min(1, Math.min(t, 1 - t) / ROT_IN));
      var ba = angLerp(restRot, ang, rotBlend);

      /* p 是墨迹中心的目标点；元素盒中心要减掉墨迹偏移 */
      var bx = p.x - cm.dx, by = p.y - cm.dy;

      flyEl.style.transform = "translate(" + (bx - size / 2).toFixed(1) + "px,"
        + (by - size / 2).toFixed(1) + "px) rotate(" + ba.toFixed(1) + "deg) scale("
        + scale.toFixed(3) + ")";

      /* 尾迹强度 = 当前移动速度：静止/初始无拖尾，移动越快越长越浓 */
      var endFade = t > 0.92 ? Math.max(0, 1 - (t - 0.92) / 0.08) : 1;
      var ref = 1.6 * len / dur;                   /* smooth 的最大斜率是 1.5 */
      var spd = 0;
      if (!last.init) {
        var ddt = ts - last.t; if (ddt < 1) ddt = 16;
        spd = Math.hypot(p.x - last.x, p.y - last.y) / ddt;
      }
      last.x = p.x; last.y = p.y; last.t = ts; last.init = false;
      var speedNorm = Math.min(1, spd / ref);

      /* 尾迹画在「实际走过的轨迹」上：静止时无轨迹点，自然没有尾迹 */
      hist.push({ x: p.x, y: p.y });
      if (hist.length > 90) hist.splice(0, hist.length - 90);
      var maxTail = 40 + 190 * speedNorm;        /* 越快，保留的轨迹越长 */
      var acc = 0, hi;
      for (hi = hist.length - 1; hi > 0; hi--) {
        acc += Math.hypot(hist[hi].x - hist[hi - 1].x, hist[hi].y - hist[hi - 1].y);
        if (acc > maxTail) { hist.splice(0, hi); break; }
      }
      if (hist.length > 2 && speedNorm > 0.03) {
        trailPath.setAttribute("d", "M" + hist.map(function (pt) {
          return pt.x.toFixed(1) + " " + pt.y.toFixed(1);
        }).join(" L"));
        trailGrad.setAttribute("x1", hist[0].x.toFixed(1));
        trailGrad.setAttribute("y1", hist[0].y.toFixed(1));
        trailGrad.setAttribute("x2", hist[hist.length - 1].x.toFixed(1));
        trailGrad.setAttribute("y2", hist[hist.length - 1].y.toFixed(1));
        var trailOp = Math.min(1, speedNorm * 1.2) * endFade;
        trailPath.style.opacity = trailOp < 0.02 ? 0 : trailOp.toFixed(3);
      } else {
        trailPath.style.opacity = 0;
      }

      if (t < 1) { requestAnimationFrame(step); return; }

      if (guide.parentNode) guide.parentNode.removeChild(guide);
      if (trailGrad.parentNode) trailGrad.parentNode.removeChild(trailGrad);
      if (trailPath.parentNode) trailPath.parentNode.removeChild(trailPath);
      flyEl.parentNode.removeChild(flyEl);
      if (starry) starry.classList.remove("on");   /* 飞行结束：淡出星空，恢复原页面 */
      document.body.classList.remove("starry-on");  /* 文字与星星颜色复原 */
      if (el.isConnected) el.style.visibility = "";
      /* 弹跳动画从冻结的相位继续 —— 星星落在起点，再自然地接着弹 */
      if (pin0) pin0.style.animationPlayState = "";
      rec.busy = false;
    }
    requestAnimationFrame(step);
  }

  /* ---------- 启动 ---------- */
  hero.appendChild(layer);
  build();

  /* 网页字体是异步加载的：字体到位前，标题用回退字体排版，
     位置和最终版不一样（实测差 ~28px）。所以字体就绪后必须重新落位，
     否则星星会停在"旧位置" —— 看起来就没对齐「话」字。
     在重新落位之前先藏起来，避免看到它跳一下。 */
  function relayout() { build(); }

  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () {
      build();
      layer.classList.add("ready");
    });
  } else {
    layer.classList.add("ready");
  }
  window.addEventListener("load", relayout);

  var rT;
  window.addEventListener("resize", function () {
    clearTimeout(rT);
    rT = setTimeout(build, 200);
  });
})(window, document);
