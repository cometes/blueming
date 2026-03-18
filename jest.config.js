/** @type {import('jest').Config} */
const config = {
	testEnvironment: "jsdom",
	transform: {
		"^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
	},
	moduleNameMapper: {
		"^server-only$": "<rootDir>/src/__mocks__/server-only.js",
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	testMatch: ["**/__tests__/**/*.test.(ts|tsx)", "**/*.test.(ts|tsx)"],
	passWithNoTests: true,
};

module.exports = config;
