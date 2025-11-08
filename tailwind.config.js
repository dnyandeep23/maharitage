/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                typewriter: {
                    '0%': { width: '0ch' },
                    '100%': { width: '100%' },
                },
                blinkCaret: {
                    '0%, 100%': { borderColor: 'transparent' },
                    '50%': { borderColor: 'currentColor' },
                },
                progress: {
                    '0%': { width: '0%' },
                    '50%': { width: '100%' },
                    '100%': { width: '0%' },
                },
            },
            animation: {
                typewriter: 'typewriter 3s steps(30) forwards',
                blinkCaret: 'blinkCaret 0.75s step-end infinite',
                progress: 'progress 2s ease-in-out infinite',
            },
        },
    },
    plugins: [],
};
