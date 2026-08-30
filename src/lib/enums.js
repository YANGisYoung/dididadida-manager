// 枚举常量与简繁映射。
// 约定：数据库里存的枚举值一律用【简体】；显示时用 enumLabel() 映射到当前语言。

export const STAGES = ['方案', '采购', '搭建', '调试', '结项']
export const BOM_STATUS = ['已采购', '待采购']
export const EXP_STATUS = ['计划中', '进行中', '已完成']
export const READ_STATUS = ['未读', '在读', '已读']
export const TODO_STATUS = ['待办', '进行中', '已完成']
export const PRIORITY = ['高', '中', '低']

// 简体 -> 繁体 映射（只列出简繁有差异的词；相同的自动原样返回）
const S2T = {
  '采购': '採購', '调试': '調試', '结项': '結項',
  '已采购': '已採購', '待采购': '待採購',
  '计划中': '計劃中', '进行中': '進行中',
  '未读': '未讀', '在读': '在讀', '已读': '已讀',
  '待办': '待辦',
}

// 把数据库里的枚举值转成当前语言下的显示文案
export function enumLabel(value, lang) {
  if (value === null || value === undefined || value === '') return value
  if (lang === 'zh-Hant') return S2T[value] ?? value
  return value
}
