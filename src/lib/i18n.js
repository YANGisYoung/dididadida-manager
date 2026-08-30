// 简繁中文翻译字典。默认繁体（zh-Hant，采用香港用词），可切换简体（zh-Hans）。
// 约定：字典 key 统一，界面文案用 t('key') 取当前语言文本。
// 说明：论文等内容字段是用户自己填写的英文，不做翻译；这里只管界面 UI 文案。

export const translations = {
  // ===== 通用 =====
  appName: { 'zh-Hant': '滴滴答滴答', 'zh-Hans': '滴滴答滴答' },
  appSubtitle: { 'zh-Hant': 'DiDiDaDiDa Manager', 'zh-Hans': 'DiDiDaDiDa Manager' },
  login: { 'zh-Hant': '登入', 'zh-Hans': '登录' },
  register: { 'zh-Hant': '註冊', 'zh-Hans': '注册' },
  logout: { 'zh-Hant': '登出', 'zh-Hans': '退出登录' },
  email: { 'zh-Hant': '電郵', 'zh-Hans': '电子邮箱' },
  password: { 'zh-Hant': '密碼', 'zh-Hans': '密码' },
  confirm: { 'zh-Hant': '確認', 'zh-Hans': '确认' },
  cancel: { 'zh-Hant': '取消', 'zh-Hans': '取消' },
  save: { 'zh-Hant': '儲存', 'zh-Hans': '保存' },
  delete: { 'zh-Hant': '刪除', 'zh-Hans': '删除' },
  deleteOk: { 'zh-Hant': '已刪除', 'zh-Hans': '已删除' },
  edit: { 'zh-Hant': '編輯', 'zh-Hans': '编辑' },
  add: { 'zh-Hant': '新增', 'zh-Hans': '新增' },
  search: { 'zh-Hant': '搜尋', 'zh-Hans': '搜索' },
  loading: { 'zh-Hant': '載入中…', 'zh-Hans': '加载中…' },
  empty: { 'zh-Hant': '暫無資料', 'zh-Hans': '暂无数据' },
  actions: { 'zh-Hant': '操作', 'zh-Hans': '操作' },
  welcome: { 'zh-Hant': '歡迎回來', 'zh-Hans': '欢迎回来' },

  // ===== 导航 =====
  navHome: { 'zh-Hant': '首頁總覽', 'zh-Hans': '首页总览' },
  navProjects: { 'zh-Hant': '項目管理', 'zh-Hans': '项目管理' },
  navExperiments: { 'zh-Hant': '實驗管理', 'zh-Hans': '实验管理' },
  navPapers: { 'zh-Hant': '論文管理', 'zh-Hans': '论文管理' },
  navTodos: { 'zh-Hant': '待辦事項', 'zh-Hans': '待办事项' },

  // ===== 首页 =====
  homeMotto: { 'zh-Hant': '個人簽名', 'zh-Hans': '个性签名' },
  mottoPlaceholder: { 'zh-Hant': '寫下一句屬於你的話…', 'zh-Hans': '写下一句属于你的话…' },
  statProjects: { 'zh-Hant': '項目總數', 'zh-Hans': '项目总数' },
  statPapers: { 'zh-Hant': '論文總數', 'zh-Hans': '论文总数' },
  statExperiments: { 'zh-Hant': '實驗總數', 'zh-Hans': '实验总数' },
  ongoing: { 'zh-Hant': '進行中', 'zh-Hans': '进行中' },
  statBom: { 'zh-Hant': '待採購物料', 'zh-Hans': '待采购物料' },
  projectProgress: { 'zh-Hant': '項目進度', 'zh-Hans': '项目进度' },
  taskBoard: { 'zh-Hant': '任務看板', 'zh-Hans': '任务看板' },
  timeline: { 'zh-Hant': '時間軸', 'zh-Hans': '时间轴' },
  recentActivity: { 'zh-Hant': '最近活動', 'zh-Hans': '最近活动' },
  quickActions: { 'zh-Hant': '快速入口', 'zh-Hans': '快速入口' },
  reminders: { 'zh-Hant': '提醒', 'zh-Hans': '提醒' },
  newProject: { 'zh-Hant': '新增項目', 'zh-Hans': '新建项目' },
  newExperiment: { 'zh-Hant': '新增實驗', 'zh-Hans': '新建实验' },
  newPaper: { 'zh-Hant': '新增論文', 'zh-Hans': '新增论文' },
  greetingNight: { 'zh-Hant': '晚安，呼嚕嚕', 'zh-Hans': '晚安，呼噜噜' },
  greetingMorning: { 'zh-Hant': '早安，啦啦啦', 'zh-Hans': '早安，啦啦啦' },
  greetingIdle: { 'zh-Hant': '啦啦啦', 'zh-Hans': '啦啦啦' },
  theme: { 'zh-Hant': '深淺色', 'zh-Hans': '深浅色' },

  // ===== 项目 =====
  projectName: { 'zh-Hant': '項目名稱', 'zh-Hans': '项目名称' },
  source: { 'zh-Hant': '來源', 'zh-Hans': '来源' },
  deadline: { 'zh-Hant': '截止日期', 'zh-Hans': '截止日期' },
  stage: { 'zh-Hant': '當前階段', 'zh-Hans': '当前阶段' },
  stages: {
    'zh-Hant': ['方案', '採購', '搭建', '調試', '結項'],
    'zh-Hans': ['方案', '采购', '搭建', '调试', '结项'],
  },
  bom: { 'zh-Hant': 'BOM 物料清單', 'zh-Hans': 'BOM 物料清单' },
  partName: { 'zh-Hant': '零件名', 'zh-Hans': '零件名' },
  material: { 'zh-Hant': '材質', 'zh-Hans': '材质' },
  quantity: { 'zh-Hant': '數量', 'zh-Hans': '数量' },
  supplier: { 'zh-Hant': '供應商', 'zh-Hans': '供应商' },
  status: { 'zh-Hant': '狀態', 'zh-Hans': '状态' },
  purchased: { 'zh-Hant': '已採購', 'zh-Hans': '已采购' },
  toPurchase: { 'zh-Hant': '待採購', 'zh-Hans': '待采购' },
  gantt: { 'zh-Hant': '進度甘特圖', 'zh-Hans': '进度甘特图' },
  phaseName: { 'zh-Hant': '階段名稱', 'zh-Hans': '阶段名称' },
  startDate: { 'zh-Hant': '開始日期', 'zh-Hans': '开始日期' },
  endDate: { 'zh-Hant': '結束日期', 'zh-Hans': '结束日期' },
  fileLinks: { 'zh-Hant': '檔案連結', 'zh-Hans': '文件链接' },
  linkTitle: { 'zh-Hant': '標題', 'zh-Hans': '标题' },
  linkUrl: { 'zh-Hant': '連結', 'zh-Hans': '链接' },
  projectImages: { 'zh-Hant': '項目圖片', 'zh-Hans': '项目图片' },
  projectNotes: { 'zh-Hant': '項目備註', 'zh-Hans': '项目备注' },

  // ===== 实验 =====
  experimentName: { 'zh-Hant': '實驗名稱', 'zh-Hans': '实验名称' },
  equipment: { 'zh-Hant': '設備/儀器', 'zh-Hans': '设备/仪器' },
  sampleNo: { 'zh-Hant': '樣品/試件編號', 'zh-Hans': '样品/试件编号' },
  expDate: { 'zh-Hant': '實驗日期', 'zh-Hans': '实验日期' },
  dataLink: { 'zh-Hant': '原始數據連結', 'zh-Hans': '原始数据链接' },
  conclusion: { 'zh-Hant': '實驗結果與結論', 'zh-Hans': '实验结果与结论' },
  linkedProject: { 'zh-Hant': '所屬項目', 'zh-Hans': '所属项目' },
  noProject: { 'zh-Hant': '（不關聯）', 'zh-Hans': '（不关联）' },
  folder: { 'zh-Hant': '文件夾', 'zh-Hans': '文件夹' },
  newFolder: { 'zh-Hant': '新增文件夾', 'zh-Hans': '新建文件夹' },
  root: { 'zh-Hant': '根目錄', 'zh-Hans': '根目录' },
  subfolders: { 'zh-Hant': '子文件夾', 'zh-Hans': '子文件夹' },
  experimentRecords: { 'zh-Hant': '實驗記錄', 'zh-Hans': '实验记录' },
  expStatusPlanned: { 'zh-Hant': '計劃中', 'zh-Hans': '计划中' },
  expStatusOngoing: { 'zh-Hant': '進行中', 'zh-Hans': '进行中' },
  expStatusDone: { 'zh-Hant': '已完成', 'zh-Hans': '已完成' },
  statistics: { 'zh-Hant': '統計圖表', 'zh-Hans': '统计图表' },
  statStatusDist: { 'zh-Hant': '狀態分佈', 'zh-Hans': '状态分布' },
  statTrend: { 'zh-Hant': '數量趨勢', 'zh-Hans': '数量趋势' },
  statCategory: { 'zh-Hant': '分類分佈', 'zh-Hans': '分类分布' },
  statEquipment: { 'zh-Hant': '設備頻次', 'zh-Hans': '设备频次' },
  statProjectLink: { 'zh-Hant': '項目關聯', 'zh-Hans': '项目关联' },

  // ===== 论文 =====
  paperTitle: { 'zh-Hant': '論文標題', 'zh-Hans': '论文标题' },
  firstAuthor: { 'zh-Hant': '第一作者', 'zh-Hans': '第一作者' },
  correspAuthor: { 'zh-Hant': '通訊作者', 'zh-Hans': '通讯作者' },
  journal: { 'zh-Hant': '期刊/會議', 'zh-Hans': '期刊/会议' },
  year: { 'zh-Hant': '年份', 'zh-Hans': '年份' },
  doi: { 'zh-Hant': 'DOI 或連結', 'zh-Hans': 'DOI 或链接' },
  readStatus: { 'zh-Hant': '閱讀狀態', 'zh-Hans': '阅读状态' },
  unread: { 'zh-Hant': '未讀', 'zh-Hans': '未读' },
  reading: { 'zh-Hant': '在讀', 'zh-Hans': '在读' },
  read: { 'zh-Hant': '已讀', 'zh-Hans': '已读' },
  star: { 'zh-Hant': '星標', 'zh-Hans': '星标' },
  onlyStar: { 'zh-Hant': '只看星標', 'zh-Hans': '只看星标' },
  tags: { 'zh-Hant': '關鍵字/標籤', 'zh-Hans': '关键词/标签' },
  notes: { 'zh-Hant': '讀書筆記', 'zh-Hans': '读书笔记' },
  keyImages: { 'zh-Hant': '關鍵圖片', 'zh-Hans': '关键图片' },
  importPdf: { 'zh-Hant': '匯入 PDF', 'zh-Hans': '导入 PDF' },
  importPdfHint: { 'zh-Hant': '上傳 PDF 自動擷取標題/作者/期刊/年份', 'zh-Hans': '上传 PDF 自动提取标题/作者/期刊/年份' },
  sortByYear: { 'zh-Hant': '按年份排序', 'zh-Hans': '按年份排序' },
  all: { 'zh-Hant': '全部', 'zh-Hans': '全部' },

  // ===== 待办 =====
  todoContent: { 'zh-Hant': '待辦內容', 'zh-Hans': '待办内容' },
  priority: { 'zh-Hant': '優先級', 'zh-Hans': '优先级' },
  high: { 'zh-Hant': '高', 'zh-Hans': '高' },
  medium: { 'zh-Hant': '中', 'zh-Hans': '中' },
  low: { 'zh-Hant': '低', 'zh-Hans': '低' },
  dueDate: { 'zh-Hant': '截止日期', 'zh-Hans': '截止日期' },
  todoStatusTodo: { 'zh-Hant': '待辦', 'zh-Hans': '待办' },
  todoStatusDoing: { 'zh-Hant': '進行中', 'zh-Hans': '进行中' },
  todoStatusDone: { 'zh-Hant': '已完成', 'zh-Hans': '已完成' },

  // ===== 提醒 =====
  remindOverdueProject: { 'zh-Hant': '個項目已逾期', 'zh-Hans': '个项目已逾期' },
  remindUpcomingProject: { 'zh-Hant': '個項目即將截止', 'zh-Hans': '个项目即将截止' },
  remindUnreadPaper: { 'zh-Hant': '篇論文尚未閱讀', 'zh-Hans': '篇论文尚未阅读' },
  remindOverdueTodo: { 'zh-Hant': '個待辦已逾期', 'zh-Hans': '个待办已逾期' },

  // ===== 语言 =====
  language: { 'zh-Hant': '語言', 'zh-Hans': '语言' },
  langZhHant: { 'zh-Hant': '繁體中文', 'zh-Hans': '繁体中文' },
  langZhHans: { 'zh-Hant': '簡體中文', 'zh-Hans': '简体中文' },
}

// 默认语言：繁体
export const DEFAULT_LANG = 'zh-Hant'

// 取翻译。用法：t('login')
export function translate(lang, key) {
  const entry = translations[key]
  if (!entry) return key
  return entry[lang] ?? entry[DEFAULT_LANG] ?? key
}
