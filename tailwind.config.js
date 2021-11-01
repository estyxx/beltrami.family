/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/**/*.{js,ts,jsx,tsx}", // Include files in the `src/` directory
		"./public/**/*.html", // Include static files in the `public/` directory
	],
	theme: {
		extend: {
			// Custom theme configurations
		},
	},
	plugins: [],
};
