module.exports = {
	collectCoverageFrom: [
		"**/*.{js,jsx,ts,tsx}",
		"!**/*.d.ts",
		"!**/node_modules/**",
	],
	// Mirrors the `baseUrl: src` path alias from tsconfig.json.
	moduleNameMapper: {
		"^(app|components|contexts|helpers|hooks|lib|styles)/(.*)$":
			"<rootDir>/src/$1/$2",
	},
	setupFiles: ["<rootDir>/jest.setup.js"],
	testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
	transform: {
		// Use babel-jest to transpile tests with the next/babel preset
		// https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
		"^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
	},
	transformIgnorePatterns: [
		"/node_modules/",
		"^.+\\.module\\.(css|sass|scss)$",
	],
};
