/** @type {import('tailwindcss').Config} */
// 设计系统配置：设计令牌（靛蓝→青绿渐变主色 + 暖橙点缀、字号、间距、圆角、阴影/景深层级）。
// 深浅双主题通过 .dark 类 + CSS 变量切换（默认浅色，见 src/styles/theme.ts）。
// 配色与令牌定义见 docs/design-v0.1.md §6 与 src/index.css。
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主色：靛蓝 → 青绿渐变（两端锚点 + 中间色）
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        // 青绿点缀（渐变末端）
        teal: {
          400: 'rgb(var(--teal-400) / <alpha-value>)',
          500: 'rgb(var(--teal-500) / <alpha-value>)',
          600: 'rgb(var(--teal-600) / <alpha-value>)',
        },
        // 暖橙点缀（CTA / 强调）
        accent: {
          DEFAULT: 'rgb(var(--accent-500) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          soft: 'rgb(var(--surface-soft) / <alpha-value>)',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // 字号令牌（rem 步进）
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.875rem', { lineHeight: '1.375rem' }],
        base: ['1rem', { lineHeight: '1.625rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }],
        '3xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '4xl': ['3rem', { lineHeight: '3.5rem' }],
        '5xl': ['3.75rem', { lineHeight: '1.1' }],
        '6xl': ['4.5rem', { lineHeight: '1.05' }],
      },
      borderRadius: {
        // 圆角令牌
        sm: '0.5rem',
        DEFAULT: '0.875rem',
        md: '0.875rem',
        lg: '1.25rem',
        xl: '1.75rem',
        '2xl': '2.25rem',
      },
      spacing: {
        // 间距令牌（4px 基准，扩展 18/22 等）
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        // 阴影 / 景深层级（多层投影）
        'depth-1': '0 1px 2px rgb(var(--shadow) / 0.06), 0 2px 8px rgb(var(--shadow) / 0.08)',
        'depth-2': '0 4px 12px rgb(var(--shadow) / 0.10), 0 12px 28px rgb(var(--shadow) / 0.12)',
        'depth-3': '0 10px 24px rgb(var(--shadow) / 0.14), 0 24px 56px rgb(var(--shadow) / 0.18)',
        glow: '0 0 0 1px rgb(var(--brand-500) / 0.18), 0 12px 40px rgb(var(--brand-500) / 0.28)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, rgb(var(--brand-600)) 0%, rgb(var(--brand-500)) 45%, rgb(var(--teal-500)) 100%)',
        'brand-soft': 'linear-gradient(135deg, rgb(var(--brand-500) / 0.14), rgb(var(--teal-500) / 0.12))',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
