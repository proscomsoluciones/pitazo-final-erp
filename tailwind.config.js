import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', 'Outfit', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    navy: '#0b192c',
                    dark: '#0f172a',
                    green: '#059669',
                    emerald: '#10b981',
                    mint: '#34d399',
                    light: '#ecfdf5',
                },
            },
        },
    },

    plugins: [forms],
};
