/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ink: {
                    700: '#2a2a35',
                    800: '#1e1e26',
                    900: '#16161c',
                    950: '#0e0e12',
                },
                ember: {
                    400: '#ff8a4c',
                    500: '#ff6b35',
                    600: '#e05a2a',
                },
                steel: {
                    100: '#f0f0f5',
                    200: '#d8d8e0',
                    300: '#b8b8c5',
                    400: '#9898a8',
                    500: '#78788c',
                    600: '#585868',
                    700: '#404050',
                },
                /* Semantic colors – WCAG AA contrast on ink-950 (#0e0e12) */
                success: {
                    DEFAULT: '#34d399', /* 7.6:1 on ink-950 */
                    muted:   '#065f46',
                },
                warning: {
                    DEFAULT: '#fbbf24', /* 12.4:1 on ink-950 */
                    muted:   '#78350f',
                },
                danger: {
                    DEFAULT: '#f87171', /* 5.6:1 on ink-950 */
                    muted:   '#7f1d1d',
                },
                info: {
                    DEFAULT: '#60a5fa', /* 5.9:1 on ink-950 */
                    muted:   '#1e3a5f',
                },
            },
            fontFamily: {
                display: ['Georgia', 'serif'],
                mono: ['Consolas', 'monospace'],
            },
        },
    },
    plugins: [],
}
