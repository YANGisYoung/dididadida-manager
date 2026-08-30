/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ===== 语义色（深浅主题共用同一组类名，值由 CSS 变量决定） =====
        // 背景三层 + 文字两层：存 RGB 三通道，用 rgb(var() / alpha) 支持透明度修饰
        base: 'rgb(var(--c-base) / <alpha-value>)',   // 页面基底
        ink: 'rgb(var(--c-ink) / <alpha-value>)',     // 主内容区
        nav: 'rgb(var(--c-nav) / <alpha-value>)',     // 侧边栏/卡片
        cream: 'rgb(var(--c-cream) / <alpha-value>)', // 主文字
        muted: 'rgb(var(--c-muted) / <alpha-value>)', // 次要文字
        // 品牌色（朱砂红固定；赭石/金随主题微调明度，保证浅色下文字对比度）
        cinnabar: '#8c3a30',     // 低饱和朱砂红（主色，深浅一致）
        'cinnabar-bright': '#a04a3a',
        ochre: 'rgb(var(--c-ochre) / <alpha-value>)',   // 淡赭石
        gold: 'rgb(var(--c-gold) / <alpha-value>)',     // 哑光金
        onaccent: '#f5ede3',     // 按钮/深色底上的固定浅色文字（不随主题变）
        // 语义色（随主题变化，本身已是 rgba，不参与透明度修饰）
        hover: 'var(--c-hover)',     // 悬浮背景
        divider: 'var(--c-divider)', // 分隔线
        field: 'var(--c-field)',     // 输入框/字段背景
      },
      fontFamily: {
        serif: ['"FangZheng JinLing"', '"Noto Serif SC"', '"Source Han Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
      },
      boxShadow: {
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.03)',
        'cinnabar': '0 0 20px rgba(140,58,48,0.3)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'flow': 'flow 6s linear infinite',
        'floaty': 'floaty 5s ease-in-out infinite',
        'grid-drift': 'grid-drift 30s ease-in-out infinite',
        'blink': 'blink 2s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        flow: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'grid-drift': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(20px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
