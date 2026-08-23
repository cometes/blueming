import "server-only";

/**
 * 외부 URL 가져오기(SSRF) 방어용 호스트 차단 판정.
 * 루프백·사설 대역·링크로컬·메타데이터 호스트를 막는다.
 * (DNS 리바인딩까지는 방어하지 않음 — 관리자 전용 기능이라 수용)
 */
export const isBlockedImportHost = (hostname: string): boolean => {
	const host = hostname.toLowerCase().replace(/\.$/, "");

	if (
		host === "localhost" ||
		host.endsWith(".localhost") ||
		host === "metadata.google.internal" ||
		host.endsWith(".internal")
	) {
		return true;
	}

	// IPv6 리터럴 ([::1] 등은 URL 파서가 대괄호를 제거해 전달)
	if (host.includes(":")) {
		if (host === "::" || host === "::1") return true;
		if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
			return true;
		}
		// IPv4-mapped (::ffff:127.0.0.1)
		const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
		if (mapped) return isBlockedImportHost(mapped[1]);
		return false;
	}

	// IPv4 리터럴
	const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (ipv4) {
		const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
		if (a === 0 || a === 10 || a === 127) return true; // 0/8, 10/8, 127/8
		if (a === 169 && b === 254) return true; // 링크로컬 (클라우드 메타데이터)
		if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
		if (a === 192 && b === 168) return true; // 192.168/16
		if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
	}

	return false;
};
