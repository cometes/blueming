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
	// .claude/worktrees(백그라운드 세션 워크트리)의 소스 복사본이 스캔되면
	// 메인 코드와 교차 실행돼 오탐이 난다
	testPathIgnorePatterns: ["/node_modules/", "/.claude/"],
	passWithNoTests: true,
};

module.exports = config;
