import axios from "axios";

export interface CreateLibraryPayload {
	title: string;
	subtitle?: string;
	content: string;
	slug?: string;
	summary?: string;
	tags?: string[];
	series?: string;
	visibility: "all" | "password" | "secret";
	password?: string;
	thumbnail?: string;
}

export interface CreateLibraryResponse {
	success: boolean;
	data: {
		id: string;
		slug?: string;
		title: string;
		createdAt: string;
	};
	message?: string;
}

/**
 * 게시글을 생성합니다.
 * @param payload 게시글 데이터
 * @returns 생성된 게시글 정보 (id, slug 포함)
 */
export const createLibraryPost = async (
	payload: CreateLibraryPayload
): Promise<CreateLibraryResponse> => {
	try {
		const response = await axios.post<CreateLibraryResponse>(
			"https://api-w5buphcleq-du.a.run.app/library/create",
			{
				...payload,
				// slug가 빈 문자열이면 null로 변환
				slug: payload.slug?.trim() || null,
				// 비공개 게시글이 아니면 password 제거
				password:
					payload.visibility === "password"
						? payload.password
						: undefined,
			}
		);

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message ||
					"게시글 생성에 실패했습니다."
			);
		}
		throw error;
	}
};

/**
 * slug 중복 여부를 확인합니다.
 * @param slug 확인할 slug
 * @returns 사용 가능하면 true
 */
export const checkSlugAvailability = async (
	slug: string
): Promise<boolean> => {
	try {
		const response = await axios.get<{ available: boolean }>(
			`https://api-w5buphcleq-du.a.run.app/library/check-slug/${slug}`
		);

		return response.data.available;
	} catch (error) {
		// API가 없으면 일단 true 반환
		return true;
	}
};



