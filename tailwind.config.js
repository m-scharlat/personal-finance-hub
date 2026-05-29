/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg:              'var(--bg)',
        'bg-alt':        'var(--bg-alt)',
        surface:         'var(--surface)',
        'surface-alt':   'var(--surface-alt)',
        border:          'var(--border)',
        'border-strong': 'var(--border-strong)',

        ink: {
          DEFAULT: 'var(--ink)',
          muted:   'var(--ink-muted)',
          faint:   'var(--ink-faint)',
        },

        terra:  'var(--terra)',
        forest: 'var(--forest)',
        red:    'var(--red)',
        amber:  'var(--amber)',
        violet: 'var(--violet)',
        blue:   'var(--blue)',
        teal:   'var(--teal)',

        mustard: 'var(--mustard)',
        sage:    'var(--sage)',
        plum:    'var(--plum)',
        rose:    'var(--rose)',
        slate:   'var(--slate)',

        'terra-soft':        'var(--terra-soft)',
        'terra-soft-strong': 'var(--terra-soft-strong)',
        'forest-soft':       'var(--forest-soft)',
        'red-soft':          'var(--red-soft)',
        'amber-soft':        'var(--amber-soft)',
        'teal-soft':         'var(--teal-soft)',
      },
      boxShadow: {
        card:  'var(--shadow-card)',
        terra: 'var(--shadow-terra)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg:      'var(--radius-lg)',
      },
      letterSpacing: {
        eyebrow: '0.10em',
      },
    },
  },
  plugins: [],
}
