/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    'src/app/**/*.{js,ts,jsx,tsx,mdx}',
    'src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic surface colors (backgrounds)
        surface: {
          base: 'rgb(var(--c-bg-base) / <alpha-value>)',
          card: 'rgb(var(--c-bg-card) / <alpha-value>)',
          elevated: 'rgb(var(--c-bg-elevated) / <alpha-value>)',
          deep: 'rgb(var(--c-bg-deep) / <alpha-value>)',
          input: 'rgb(var(--c-bg-input) / <alpha-value>)',
          hover: 'rgb(var(--c-bg-hover) / <alpha-value>)',
          alt: 'rgb(var(--c-bg-alt) / <alpha-value>)',
          edit: 'rgb(var(--c-bg-edit) / <alpha-value>)',
          active: 'rgb(var(--c-bg-active) / <alpha-value>)',
        },
        // Semantic border colors
        line: {
          DEFAULT: 'rgb(var(--c-border) / <alpha-value>)',
          hover: 'rgb(var(--c-border-hover) / <alpha-value>)',
        },
        // Semantic text colors
        content: {
          primary: 'rgb(var(--c-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--c-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--c-text-tertiary) / <alpha-value>)',
          muted: 'rgb(var(--c-text-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-text-faint) / <alpha-value>)',
          dim: 'rgb(var(--c-text-dim) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
