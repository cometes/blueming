/**
 * 제목을 기반으로 URL 친화적인 slug를 생성합니다.
 * @param title - 게시글 제목
 * @returns URL 친화적인 slug
 */
export function generateSlug(title: string): string {
	if (!title) return "";

	return (
		title
			.trim()
			.toLowerCase()
			// 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈만 허용)
			.replace(/[^a-z0-9가-힣\s-]/g, "")
			// 연속된 공백을 하나의 하이픈으로
			.replace(/\s+/g, "-")
			// 연속된 하이픈을 하나로
			.replace(/-+/g, "-")
			// 앞뒤 하이픈 제거
			.replace(/^-+|-+$/g, "")
			// 최대 길이 제한 (50자)
			.slice(0, 50)
			// 끝에 하이픈이 있으면 제거
			.replace(/-+$/, "")
	);
}

/**
 * slug가 유효한지 검증합니다.
 * @param slug - 검증할 slug
 * @returns 유효하면 true
 */
export function isValidSlug(slug: string): boolean {
	if (!slug || slug.length === 0) return true; // 빈 값은 허용 (UUID 사용)
	if (slug.length > 50) return false;

	// 한글, 영문, 숫자, 하이픈만 허용
	const slugPattern = /^[a-z0-9가-힣-]+$/;
	return slugPattern.test(slug);
}

/**
 * slug를 정규화합니다.
 * @param slug - 정규화할 slug
 * @returns 정규화된 slug
 */
export function normalizeSlug(slug: string): string {
	if (!slug) return "";

	return slug
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9가-힣-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50)
		.replace(/-+$/, "");
}



