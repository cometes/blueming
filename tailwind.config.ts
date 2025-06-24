import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'jingle': 'jingle 0.6s ease-in-out',
        'music-bar': 'musicBar 1.2s ease infinite',
      },
      keyframes: {
        jingle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(10deg)' },
          '75%': { transform: 'rotate(-10deg)' },
        },
        musicBar: {
          '0%': { height: '4px' },
          '50%': { height: '14px' },
          '100%': { height: '4px' },
        },
      },
      backgroundImage: {
        'theme': 'var(--bg-image)',
      },
    },
  },
  plugins: [],
}

export default config