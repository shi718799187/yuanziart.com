/* ============================================================
   全站唯一内容源
   ------------------------------------------------------------
   改网站内容 = 只改这个文件，然后运行 build（双击 build.bat）。
   改完不需要碰任何 HTML。
   ------------------------------------------------------------
   颜色可填的值（对应 style.css 里的色板）：
     'ink' 墨黑   'frame' 纸白
     'c1' 珊瑚橙  'c2' 暖阳黄  'c3' 嫩草绿
     'c4' 晴空蓝  'c5' 薰衣草紫  'c6' 蜜桃粉
   ------------------------------------------------------------
   注意：plain 文本里不要写 < > & 以外的 HTML，
   如需换行可用 <br>，会被原样输出到页面。
   ============================================================ */

module.exports = {

  /* ========== 1. 站点基本信息 ========== */
  site: {
    name: '圆子',                       // 中文名（导航、页脚、弹层）
    nameEn: 'YUANZI',                   // 英文名
    role: 'ILLUSTRATOR',                // 竖排签名栏里的身份
    established: 'EST. 2016',
    /* 真实域名（结尾不要斜杠），用于 sitemap / og:url / canonical / og:image。
       留空则这几项不生成 —— 分享到微信时就没有缩略图和规范网址 */
    domain: 'https://yuanziart.com',
    /* 社交分享缩略图：填真实域名后会拼成绝对地址。
       当前这张是 1200×630 的合成封面（纸底 + 首图微倾），由 work-01 衍生而来。
       想换成专门做的横图，直接替换 assets/images/hero-01.jpg 即可 */
    ogImage: 'assets/images/hero-01.jpg',
    locale: 'zh-CN'
  },

  /* ========== 1.5 统计（Plausible · 免费且隐私友好） ==========
     上线后把 domain 填成真实域名（如 xxx.netlify.app 或 yourdomain.com），
     重新 build 即生效；留空则前端不加载统计脚本。 */
  analytics: {
    provider: 'plausible',
    domain: ''
  },

  /* ========== 2. 联系方式（全站共用，改一处即可） ========== */
  contact: {
    wechatId: 'yuanzi8288',
    /* 微信二维码图片路径。把真实二维码存成这个文件就会自动显示；
       文件不存在时弹层显示「建设中」占位 */
    wechatQr: 'assets/images/wechat-qr.png',
    email: '931981993@qq.com',
    /* 授课平台：url 填写后页脚会自动变成可点击外链；留空则只显示名称 */
    platform: { name: 'CCtalk', url: '' },
    /* 弹层里的用途告知（合规要求，建议保留） */
    consent: '添加时请备注「插画课」，我会在 1–2 个工作日内回复。<br>你提供的联系方式仅用于课程咨询，不会用于其他用途。'
  },

  /* ========== 3. 导航 ========== */
  nav: [
    { label: '首页', href: 'index.html',   key: 'home' },
    { label: '作品', href: 'portfolio.html', key: 'portfolio' },
    { label: '课程', href: 'courses.html',  key: 'courses' },
    { label: '关于', href: 'about.html',    key: 'about' }
  ],

  /* ========== 4. 作品库（只写一次，首页和作品集都引用它） ==========
     id       唯一标识，首页 featured 通过 id 引用
     title    中文名      en 英文名      year 年份
     cat      分类 key（见 portfolio.filters 的 filter 值）
     catLabel 分类中文名（显示在 Fig.01 · 后面）
     img      图片路径（不含扩展名，构建时自动套 picture：webp 优先）
     alt      无障碍描述
     ratio    卡片显示比例（宽/高）。这里统一填 '3/4'，三列网格才整齐；
              代价是比例不符的作品会被裁掉一截（05 / 07 / 08 裁得较多）。
              想零裁切就改成各作品裁白边后的真实比例：
              01 .743   02 .743   03 .748   04 .762
              05 .628   06 .759   07 .922   08 .657
              （试过按真实比例显示：第一行整齐，但后两行高度差太大、留白显眼，因此回退）
     rotate   卡片旋转角度，如 '-1.2deg'（正负随意）
     leaf     衬纸颜色（c1~c6）—— 衬纸已从作品卡移除，这两个字段暂无渲染出口
     leafRotate 衬纸旋转角度
     featured true 则出现在首页「近期创作」
  */
  works: [
    { id: '01', title: '云端赏月', en: 'Cloud Gazing', year: '2026',
      cat: 'fantasy', catLabel: '奇幻', img: 'assets/images/work-01',
      alt: '女孩坐在云朵上望着月亮', ratio: '3/4', rotate: '-1.2deg', leaf: 'c4', leafRotate: '2deg', featured: true },

    { id: '02', title: '荷叶上的雨', en: 'Rain on the Lotus', year: '2026',
      cat: 'nature',  catLabel: '自然', img: 'assets/images/work-02',
      alt: '女孩举着荷叶在雨中与青蛙同行', ratio: '3/4', rotate: '1deg', leaf: 'c3', leafRotate: '-2deg', featured: true },

    { id: '03', title: '许愿树', en: 'Wishing Tree', year: '2026',
      cat: 'tale', catLabel: '童话', img: 'assets/images/work-03',
      alt: '星空下的许愿树与树下的小狐狸', ratio: '3/4', rotate: '-0.8deg', leaf: 'c5', leafRotate: '2.4deg', featured: true },

    { id: '04', title: '夜读', en: 'Night Reading', year: '2025',
      cat: 'tale', catLabel: '童话', img: 'assets/images/work-04',
      alt: '深夜灯下读书的女孩和探头张望的小怪兽', ratio: '3/4', rotate: '1.3deg', leaf: 'c6', leafRotate: '-1.8deg', featured: false },

    { id: '05', title: '敲门的万圣夜', en: 'Trick or Treat', year: '2025',
      cat: 'fantasy', catLabel: '奇幻', img: 'assets/images/work-05',
      alt: '女巫打开门，门外飘着幽灵与南瓜花环', ratio: '3/4', rotate: '-1deg', leaf: 'c2', leafRotate: '2deg', featured: true },

    { id: '06', title: '夏日午后', en: 'Summer', year: '2026',
      cat: 'nature',  catLabel: '自然', img: 'assets/images/work-06',
      alt: '夏天树荫下和猫待在一起的女孩', ratio: '3/4', rotate: '0.9deg', leaf: 'c1', leafRotate: '-2.2deg', featured: true },

    { id: '07', title: '雪天长椅', en: 'A Snowy Day', year: '2025',
      cat: 'tale', catLabel: '童话', img: 'assets/images/work-07',
      alt: '下雪天长椅上抱着小熊的女孩', ratio: '3/4', rotate: '-1.1deg', leaf: 'c4', leafRotate: '1.9deg', featured: true },

    { id: '08', title: '小怪兽夜市', en: 'Monster Night Market', year: '2026',
      cat: 'fantasy', catLabel: '奇幻', img: 'assets/images/work-08',
      alt: '挂满灯笼的夜市里忙碌的小怪兽', ratio: '3/4', rotate: '1.2deg', leaf: 'c3', leafRotate: '-1.6deg', featured: false }
  ],

  /* ========== 5. 首页 ========== */
  home: {
    seo: {
      title: '圆子 · 插画师 | 把世界画成童话',
      desc: '圆子，儿童插画师，6 年线上插画教学经验。12 周系统训练营，从一根线条到完整故事画面，零基础友好。'
    },
    hero: {
      idx: 'No.01 / 首页',
      tags: [
        { text: 'Illustrator',      color: 'ink' },
        { text: 'Since 2016',       color: 'x'   },
        { text: '6 Years Teaching', color: 'y'   }
      ],
      /* 标题背板：可增删改，数量不限。
         text   文字 / rotate 旋转角 / bg 背板色 / shadow 硬阴影色 / z 3D 深度（px，越大越靠前） */
      title: [
        { text: '把世界', rotate: '-1.6deg', bg: 'frame', shadow: 'c1', z: '30px' },
        { text: '画成',   rotate: '1.2deg',  bg: 'c2',    shadow: 'c6', z: '46px' },
        { text: '童话',   rotate: '-0.8deg', bg: 'c4',    shadow: 'c5', z: '22px' }
      ],
      handline: '绘画，是一场提起画笔的旅程',
      lead: '我是圆子，儿童插画师，也是 6 年线上插画课老师。我相信每个人都藏着一颗童心，而我的工作，是带你把它画出来。',
      chips: [
        { text: '12 周系统训练', color: 'x' },
        { text: '每周直播',      color: ''  },
        { text: '一对一作业点评', color: ''  },
        { text: '零基础友好',    color: ''  }
      ],
      actions: [
        { label: '了解课程', href: 'courses.html', style: 'solid',   track: 'cta_course_hero' },
        { label: '微信咨询', wechat: true,         style: 'outline', track: 'cta_wechat_hero' }
      ],
      /* 首屏右边是"单幅作品"展示（早期版本是三张叠纸，现已改为单幅）。
         只保留被模板用到的第 0 项。社交分享缩略图是另一张：hero-01.jpg。 */
      stack: [
        { img: 'assets/images/work-01', alt: '女孩坐在云朵上望着月亮', cls: 'stk-1', leaf1: 'c3', leaf2: 'c4', loading: 'eager' }
      ]
    },

    stats: {
      note: '数字为示例，正式上线前请替换为真实数据',   // 留空则不显示这行
      items: [
        { value: 6,    suffix: '',  unit: '年', label: 'Teaching' },
        { value: 30,   suffix: '+', unit: '期', label: 'Courses'  },
        { value: 5000, suffix: '+', unit: '',   label: 'Students' },
        { value: 9,    suffix: '',  unit: '.0', label: 'Rating'   }
      ]
    },

    worksSection: {
      eyebrow: 'Selected Works',
      title: '近期的创作',
      text: '一些可爱的角色与明亮的故事。它们是我观察世界的方式，也是课堂上我会拆给你看的每一笔。',
      moreLabel: '查看全部作品'
    },

    voices: {
      eyebrow: 'Voices',
      title: '学员的声音',
      text: '六年来最让我有成就感的时刻，是看到学员画出自己的作品。以下为示例评价，正式上线前将替换为真实学员反馈。',
      /* placeholder 为 true 时显示「示例占位」角标 —— 换成真实评价后记得删掉 */
      items: [
        { quote: '老师把每一步都画给我们看，跟着学，一点都不觉得难。',
          initial: '林', name: '学员 · 示例', batch: '第 23 期', placeholder: true },
        { quote: '最期待每周的作业点评，老师讲得又细又温柔。',
          initial: '苏', name: '学员 · 示例', batch: '第 18 期', placeholder: true },
        { quote: '零基础学了一年，现在能画出完整的故事画面了。',
          initial: '陈', name: '学员 · 示例', batch: '第 11 期', placeholder: true }
      ]
    },

    band: {
      eyebrow: 'Start Here',
      title: '从一根线条开始，画出会笑的世界',
      text: '每周直播授课 · 一对一作业点评 · 从工具到完稿的系统训练。零基础友好，也适合想突破瓶颈的你。',
      actions: [
        { label: '了解课程', href: 'courses.html', style: 'light',   track: 'cta_course_band' },
        { label: '微信咨询', wechat: true,         style: 'outline', track: 'cta_wechat_band' }
      ]
    }
  },

  /* ========== 6. 作品集页 ========== */
  portfolio: {
    seo: {
      title: '作品集 · 圆子插画师',
      desc: '圆子插画师作品集：动物、海洋、太空、童话、自然与日常主题的明亮插画，点击查看大图。'
    },
    head: {
      eyebrow: 'Portfolio · 2025—2026',
      title: [
        { text: '作品集',         rotate: '-1.4deg', bg: 'frame', shadow: 'c3', z: '30px' },
        { text: 'Selected works', rotate: '1deg',    bg: 'c2',    shadow: 'c1', z: '24px' }
      ],
      lead: '按主题收集近年创作。点击任意作品查看大图。'
    },
    /* 筛选按钮：filter 值要和 works 里各条目的 cat 对应 */
    filters: [
      { label: '全部', filter: 'all'    },
      { label: '奇幻', filter: 'fantasy'},
      { label: '童话', filter: 'tale'   },
      { label: '自然', filter: 'nature' }
    ],
    foot: {
      handline: '想画出这样的角色与故事？',
      text: '每一张的创作过程，都会在课程里拆解给你看。',
      action: { label: '查看课程', href: 'courses.html', style: 'solid', track: 'cta_course_portfolio' }
    }
  },

  /* ========== 7. 课程页 ========== */
  course: {
    seo: {
      title: '课程 · 童话插画系统训练营 | 圆子',
      desc: '圆子插画师 6 年打磨的线上插画课：12 周系统训练，每周直播授课、一对一作业点评，从工具到完稿，零基础友好。'
    },
    head: {
      eyebrow: 'Course · 2026 Autumn',
      title: [
        { text: '童话插画',   rotate: '-1.4deg', bg: 'frame', shadow: 'c1', z: '30px' },
        { text: '系统训练营', rotate: '1.2deg',  bg: 'c2',    shadow: 'c4', z: '24px' }
      ],
      lead: '12 周，从一根线条到完整故事画面。6 年教学经验打磨的课程，零基础友好，也适合想突破瓶颈的你。',
      chips: ['每周直播', '一对一作业点评', '12 周训练', '回放永久有效'],
      price: '¥2,699',
      priceNote: '示例价格 · 报名详情请微信咨询',
      actions: [
        { label: '报名本期课程', href: '#apply', style: 'solid',   track: 'cta_apply_top' },
        { label: '常见问题',     href: '#faq',   style: 'outline', track: '' }
      ]
    },
    audience: {
      eyebrow: "Who It's For",
      title: '适合这样的你',
      items: [
        { t: '零基础小白',       d: '没有绘画基础，想认真学会一门能陪伴一生的技能' },
        { t: '自学卡壳的画手',   d: '能临摹但不会原创，缺一套系统的创作方法论' },
        { t: '想画儿童插画的人', d: '目标是画出可爱的角色与生动的故事，甚至接童书商稿' }
      ]
    },
    curriculum: {
      eyebrow: 'Curriculum',
      title: '课程大纲',
      items: [
        { t: '工具与画布',     d: '软件、画笔与图层逻辑，搭一个舒服的画室' },
        { t: '线条的魔法',     d: '圆润控线、造型基础，画出流畅可爱的线条' },
        { t: '配色乐园',       d: '明亮又和谐的色彩搭配，告别脏乱配色' },
        { t: '可爱角色设计',   d: '小动物与小人的五官、比例和表情' },
        { t: '故事构图',       d: '让画面会讲故事：视角、节奏与留白' },
        { t: '场景与氛围',     d: '天空、森林、海底……给角色一个家' },
        { t: '完整创作流程',   d: '从灵感草图到成稿的完整过程演示' },
        { t: '毕业创作',       d: '完成属于你的故事画面，学会展示它' }
      ]
    },
    howItWorks: {
      eyebrow: 'How It Works',
      title: '学习方式',
      items: [
        { k: '授课形式', v: '每周 1 次直播课 · 可回放' },
        { k: '作业点评', v: '每课作业一对一视频点评' },
        { k: '学习社群', v: '学员群互助 · 老师答疑' },
        { k: '课程周期', v: '12 周 · 回放永久有效' }
      ]
    },
    faq: {
      eyebrow: 'FAQ',
      title: '常见问题',
      items: [
        { q: '完全没有绘画基础，能跟上吗？',
          a: '可以。课程前四周专门打基础，从线条和造型开始，大量学员都是零基础入门。每周作业点评会针对你的进度调整建议。' },
        { q: '需要准备什么设备？',
          a: '一台电脑 + 数位板即可（品牌不限），课程会讲解设备选择与软件设置。入门款手绘板就能开始学习。' },
        { q: '每周需要投入多少时间？',
          a: '建议每周 4–6 小时：1 次直播课 + 2–3 次练习。老师会教方法，但手感需要你坚持练出来。' },
        { q: '学完能达到什么水平？',
          a: '认真完成全部作业的学员，结课时能独立完成原创故事插画，具备继续进阶或尝试接稿的基础能力。' }
      ]
    },
    apply: {
      eyebrow: 'Apply',
      title: '2026 秋季班 · 招生中',
      text: '12 周系统训练 · 限额小班<br>示例价格 ¥2,699<br>开课时间：示例日期（以微信通知为准）',
      button: { label: '微信咨询报名', wechat: true, style: 'light', track: 'cta_apply_card' }
    },
    /* 侧栏学员声音：渲染在报名卡下方（见 templates/courses.html 的 aside）。
       以前模板里有这段、数据源里没有这个字段，条件判断恒为假，整张卡片永远不显示。
       placeholder 为 true 时显示「示例占位」角标 —— 换成真实评价后记得删掉该字段 */
    sideQuote: {
      quote: '跟着老师一步一步画，第一次觉得原创没有那么难。',
      initial: '周',
      name: '学员 · 示例',
      batch: '第 26 期',
      placeholder: true
    },
    trial: {
      eyebrow: 'First Step',
      title: '先来试听一节课，再决定',
      text: '添加微信获取免费试听课与往期学员作品集。没有压力，画得开心最重要。',
      actions: [
        { label: '免费领取试听课', wechat: true,        style: 'light',   track: 'cta_trial' },
        { label: '认识老师',       href: 'about.html',  style: 'outline', track: '' }
      ]
    }
  },

  /* ========== 8. 关于页 ========== */
  about: {
    seo: {
      title: '关于 · 圆子插画师',
      desc: '圆子，儿童插画师与 6 年线上插画教学经验。个人介绍、教学理念、成长时间线与学员成果。'
    },
    head: {
      eyebrow: 'About',
      title: [
        { text: '关于圆子',   rotate: '-1.4deg', bg: 'frame', shadow: 'c4', z: '30px' },
        { text: 'About me',   rotate: '1deg',    bg: 'c6',    shadow: 'c5', z: '24px' }
      ],
      lead: '画了十年，教了六年。作品与课堂，是我和世界聊天的方式。'
    },
    intro: {
      eyebrow: 'Hello',
      img: 'assets/images/studio-01',
      imgAlt: '画案上的画笔与彩色画稿',
      /* 段落数组，想加段落就加一条 */
      paragraphs: [
        '我是圆子，儿童插画师，线上插画课老师。',
        '2016 年我开始认真画画，2018 年第一次站上线上课堂。六年里，我见证了太多学员从「不敢下笔」到「画出自己的故事」——那种时刻，比任何作品都让我开心。',
        '我相信画画不是天赋者的特权，而是一套可以被教、被练、被学会的方法。这也是我的课程一直坚持小班制、逐张点评的原因。'
      ]
    },
    philosophy: {
      eyebrow: 'Philosophy',
      text: '「教画画的本质，不是教会技法，<br>是教回童心。当你像孩子一样敢画了，手就会慢慢跟上来。」'
    },
    journey: {
      eyebrow: 'Journey',
      title: '成长时间线',
      note: '示例内容 · 正式上线前请替换为真实经历',
      items: [
        { yr: '2016', tx: '开始全职插画创作，第一次在展览中展出作品。' },
        { yr: '2018', tx: '成为一名线上插画老师，开启教学之路。' },
        { yr: '2020', tx: '累计学员突破 1,000 人，课程口碑持续走高。' },
        { yr: '2022', tx: '打磨出「童话插画训练营」课程体系，坚持小班与逐张点评。' },
        { yr: '2024', tx: '多名学员作品入选儿童绘本展，开始接到童书合作。' },
        { yr: '2026', tx: '累计陪伴 5,000+ 学员，继续画，继续教。' }
      ]
    },
    statsNote: '数字为示例，正式上线前请替换为真实数据',
    band: {
      eyebrow: "Let's Draw",
      title: '下一个画出童话的人，可以是你',
      actions: [
        { label: '了解课程', href: 'courses.html', style: 'light',   track: 'cta_course_about' },
        { label: '微信咨询', wechat: true,         style: 'outline', track: 'cta_wechat_about' }
      ]
    }
  },

  /* ========== 9. 页脚（全站共用） ========== */
  footer: {
    blurb: '儿童插画师 · 6 年线上插画教学。把世界画成童话，陪你画出自己的故事。',
    columns: [
      { title: 'Explore', items: [
        { label: '首页', href: 'index.html' },
        { label: '作品', href: 'portfolio.html' },
        { label: '课程', href: 'courses.html' },
        { label: '关于', href: 'about.html' }
      ]},
      { title: 'Contact', items: [
        /* 这三条只写"标签"，具体值由 footer.html 从上面的 contact.* 取 ——
           以前把值也写在这里，结果同一个微信号/邮箱/平台名在项目里各有两三份，
           改一处漏一处。现在 contact 是唯一来源。 */
        { label: '微信：', wechat: true },
        { label: '邮箱：', mailto: true },
        { label: '授课平台：', platform: true }
      ]}
    ],
    bottom: ['PAINTED WITH HEART']
  },

  /* ========== 10. 主题（一般不用改） ========== */
  theme: {
    paper: '#FFFDF7',
    tilt: '8deg'      // 3D 倾斜强度，想更明显就调大
  }
};
