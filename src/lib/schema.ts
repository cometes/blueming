import * as yup from "yup";

export const schemaCreate = yup.object({
	title: yup.string().required("제목을 입력해주세요."), // 제목 필수
	subtitle: yup.string().nullable(), // 서브타이틀 선택적
	content: yup.string().required("내용을 입력해주세요."), // 콘텐츠 필수
	tags: yup
		.array()
		.of(yup.string()) // 문자열로 구성된 배열
		.min(0, "태그는 0개부터 입력 가능합니다.")
		.max(5, "최대 5개의 태그만 입력할 수 있습니다.")
		.nullable(), // 태그 배열은 null 허용
	series: yup.string().nullable(), // 시리즈는 null 또는 문자열
	allow: yup
		.string()
		.oneOf(["all", "password", "secret"], "올바른 허용 옵션을 선택해주세요.")
		.required("공개 범위를 선택해주세요."),
	password: yup.string().when("allow", {
		is: "password", // "allow" 필드 값이 "password"일 때 조건
		then: () =>
			yup
				.string()
				.required("비밀번호를 입력해주세요.") // 필수 값 설정
				.min(4, "비밀번호를 입력해주세요.") // 최소 길이
				.max(16, "비밀번호는 최대 16자까지 입력 가능합니다."), // 최대 길이

		otherwise: () => yup.string().nullable(), // 그 외에는 null 허용
	}),
	// thumbnail: yup.string().nullable(), // 썸네일은 null 또는 문자열
});

export const schemaSettingsGeneral = yup.object({
	title: yup.string().nullable(),
	desc: yup.string().nullable(),
	logoText: yup.string().nullable(),
	favicon: yup.string().nullable(),
	shareImage: yup.string().nullable(),
	logoImage: yup.string().nullable(),
	logoType: yup.string().oneOf(["기본", "이미지", "텍스트"]).nullable(),
	primaryColor: yup.string().nullable(),
	secondaryColor: yup.string().nullable(),
});
