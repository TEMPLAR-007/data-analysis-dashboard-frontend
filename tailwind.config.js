/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3f51b5',
                'primary-dark': '#303f9f',
                'primary-light': '#c5cae9',
                secondary: '#f50057',
                background: '#f5f5f5',
                card: '#ffffff',
                text: '#333333',
                border: '#e0e0e0',
                success: '#4caf50',
                warning: '#ff9800',
                error: '#f44336',
            },
            boxShadow: {
                card: '0 2px 8px rgba(0, 0, 0, 0.1)',
                header: '0 2px 4px rgba(0, 0, 0, 0.1)',
            },
            fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem',
                '4xl': '2.25rem',
            },
            spacing: {
                '1': '0.25rem',
                '2': '0.5rem',
                '3': '0.75rem',
                '4': '1rem',
                '5': '1.25rem',
                '6': '1.5rem',
                '8': '2rem',
                '10': '2.5rem',
                '12': '3rem',
                '16': '4rem',
                '20': '5rem',
                '24': '6rem',
                '32': '8rem',
                '40': '10rem',
                '48': '12rem',
                '64': '16rem',
            },
            borderRadius: {
                'none': '0',
                'sm': '0.125rem',
                DEFAULT: '0.25rem',
                'md': '0.375rem',
                'lg': '0.5rem',
                'xl': '0.75rem',
                'full': '9999px',
            },
            transitionDuration: {
                '200': '200ms',
                '300': '300ms',
            },
        },
    },
    plugins: [
        daisyui
    ],
}