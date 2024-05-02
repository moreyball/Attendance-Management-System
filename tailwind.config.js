/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		screens: {
			"max-md": {'max': '768px'},
			"max-sm": {'max': '640px'},
			"max-lg": {'max': '1024px'},
			"max-xl": {'max': '1280px'},
			"max-2xl": {'max': '1536px'},
			"sm": {'min': '640px'},
			"md": {'min': '768px'},
			"lg": {'min': '1024px'},
			"xl": {'min': '1280px'},
			"2xl": {'min': '1536px'},
		},
		extend: {
			colors: {
				primary: {
					50: "#F6F8FF",
					100: "#EDF0FF",
					200: "#D1DAFE",
					300: "#B4C2FD",
					400: "#8092FF",
					500: "#4669fa",
					600: "#3F5EDF",
					700: "#2A3F96",
					800: "#203071",
					900: "#151F49",
				},
				secondary: {
					50: "#F9FAFB",
					100: "#F4F5F7",
					200: "#E5E7EB",
					300: "#D2D6DC",
					400: "#9FA6B2",
					500: "#A0AEC0",
					600: "#475569",
					700: "#334155",
					800: "#1E293B",
					900: "#0F172A",
				},
				danger: {
					50: "#FFF7F7",
					100: "#FEEFEF",
					200: "#FCD6D7",
					300: "#FABBBD",
					400: "#F68B8D",
					500: "#F1595C",
					600: "#D75052",
					700: "#913638",
					800: "#6D292A",
					900: "#461A1B",
				},
				black: {
					50: "#F9FAFB",
					100: "#F4F5F7",
					200: "#E5E7EB",
					300: "#D2D6DC",
					400: "#9FA6B2",
					500: "#111112",
					600: "#475569",
					700: "#334155",
					800: "#1E293B",
					900: "#0F172A",
				},
				warning: {
					50: "#FFFAF8",
					100: "#FFF4F1",
					200: "#FEE4DA",
					300: "#FDD2C3",
					400: "#FCB298",
					500: "#FA916B",
					600: "#DF8260",
					700: "#965741",
					800: "#714231",
					900: "#492B20",
				},
				info: {
					50: "#F3FEFF",
					100: "#E7FEFF",
					200: "#C5FDFF",
					300: "#A3FCFF",
					400: "#5FF9FF",
					500: "#0CE7FA",
					600: "#00B8D4",
					700: "#007A8D",
					800: "#005E67",
					900: "#003F42",
				},
				success: {
					50: "#F3FEF8",
					100: "#E7FDF1",
					200: "#C5FBE3",
					300: "#A3F9D5",
					400: "#5FF5B1",
					500: "#50C793",
					600: "#3F9A7A",
					700: "#2E6D61",
					800: "#1F4B47",
					900: "#0F2A2E",
				},
				gray: {
					50: "#F9FAFB",
					100: "#F4F5F7",
					200: "#E5E7EB",
					300: "#D2D6DC",
					400: "#9FA6B2",
					500: "#68768A",
					600: "#475569",
					700: "#334155",
					800: "#1E293B",
					900: "#0F172A",
				},
				"dark_mode_bg": "#1E2021", 
				"dark_mode_card": "#181A1B",
				"dark_text": "#CCC7C1",
				"dark_text2": "#A9BACA",
				"dark_left_bar_icon": "#C1C0BE",
				"dark_textbox_title": "#9D9487",
				"dark_textbox": "#1D2021",
				"dark_textbox_line": "#363B3D",
				"dark_placeholder_text": "#56544E"
			},
			keyframes: {
				"accordion-down": {
					from: { height: 0 },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: 0 },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			width: {
				a4: '210mm',
			},
			height: {
			    a4: '297mm',
			},
			fontFamily: {
				'arial-narrow': ['Arial Narrow', 'sans-serif'],
				JetBrains: ['JetBrains Mono Variable', 'monospace'],
				Nudito: ['Nunito Variable','sans-serif']
			},
		},
	},
	plugins: [
		require("tailwindcss-animate"),
		require("@shrutibalasa/tailwind-grid-auto-fit"),
	],
};
