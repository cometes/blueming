import { isBlockedImportHost } from "@/app/api/_lib/urlGuard";

describe("isBlockedImportHost (SSRF 방어)", () => {
	it("루프백·로컬 호스트 차단", () => {
		expect(isBlockedImportHost("localhost")).toBe(true);
		expect(isBlockedImportHost("app.localhost")).toBe(true);
		expect(isBlockedImportHost("127.0.0.1")).toBe(true);
		expect(isBlockedImportHost("127.8.8.8")).toBe(true);
		expect(isBlockedImportHost("0.0.0.0")).toBe(true);
		expect(isBlockedImportHost("::1")).toBe(true);
	});

	it("사설 대역·링크로컬·메타데이터 차단", () => {
		expect(isBlockedImportHost("10.0.0.5")).toBe(true);
		expect(isBlockedImportHost("172.16.0.1")).toBe(true);
		expect(isBlockedImportHost("172.31.255.255")).toBe(true);
		expect(isBlockedImportHost("192.168.0.10")).toBe(true);
		expect(isBlockedImportHost("169.254.169.254")).toBe(true);
		expect(isBlockedImportHost("100.64.1.1")).toBe(true);
		expect(isBlockedImportHost("metadata.google.internal")).toBe(true);
		expect(isBlockedImportHost("fe80::1")).toBe(true);
		expect(isBlockedImportHost("fd00::1")).toBe(true);
		expect(isBlockedImportHost("::ffff:192.168.0.1")).toBe(true);
	});

	it("공인 호스트는 허용", () => {
		expect(isBlockedImportHost("example.com")).toBe(false);
		expect(isBlockedImportHost("images.unsplash.com")).toBe(false);
		expect(isBlockedImportHost("8.8.8.8")).toBe(false);
		expect(isBlockedImportHost("172.32.0.1")).toBe(false);
		expect(isBlockedImportHost("2606:4700::1111")).toBe(false);
	});
});
