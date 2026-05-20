/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  // Scope Tailwind specificity to the app shell so CDK overlays are not forced globally.
  important: '#jb-root',
  theme: {
    extend: {
      colors: {
        jb: {
          app: 'var(--jb-bg-app)',
          surface: 'var(--jb-bg-surface)',
          muted: 'var(--jb-bg-muted)',
          toolbar: 'var(--jb-bg-toolbar)',
          code: 'var(--jb-bg-code)',
          elevated: 'var(--jb-bg-elevated)',
          border: 'var(--jb-border)',
          'border-strong': 'var(--jb-border-strong)',
          text: 'var(--jb-text)',
          secondary: 'var(--jb-text-secondary)',
          muted: 'var(--jb-text-muted)',
          accent: 'var(--jb-accent)',
          'accent-hover': 'var(--jb-accent-hover)',
          success: 'var(--jb-success)',
          error: 'var(--jb-error)',
        },
      },
      fontFamily: {
        sans: ['var(--jb-font-sans)'],
        mono: ['var(--jb-font-mono)'],
      },
      borderRadius: {
        jb: 'var(--jb-radius-md)',
        'jb-sm': 'var(--jb-radius-sm)',
        'jb-lg': 'var(--jb-radius-lg)',
        'jb-pill': 'var(--jb-radius-pill)',
      },
      boxShadow: {
        'jb-sm': 'var(--jb-shadow-sm)',
        'jb-md': 'var(--jb-shadow-md)',
        'jb-lg': 'var(--jb-shadow-lg)',
        'jb-xl': 'var(--jb-shadow-xl)',
      },
      transitionTimingFunction: {
        jb: 'var(--jb-ease-standard)',
        'jb-spring': 'var(--jb-ease-spring)',
      },
      transitionDuration: {
        jb: 'var(--jb-duration-normal)',
        'jb-fast': 'var(--jb-duration-fast)',
        'jb-slow': 'var(--jb-duration-slow)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
