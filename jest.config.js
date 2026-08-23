/** @type {import('jest').Config} */
const config = {
	testEnvironment: "jsdom",
	transform: {
		"^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
	},
	// jest.setup.ts(@testing-library/jest-dom)가 실제로 로드되도록 연결
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^server-only$": "<rootDir>/src/__mocks__/server-only.js",
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	testMatch: ["**/__tests__/**/*.test.(ts|tsx)", "**/*.test.(ts|tsx)"],
	passWithNoTests: true,
};

module.exports = config;
