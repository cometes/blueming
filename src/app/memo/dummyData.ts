export type MemoReply = {
	id: string;
	content: string;
	author: string;
	createdAt: string;
	reactions?: {
		hearts: number;
		likes: number;
		comments: number;
	};
};

export type Memo = {
	id: string;
	title: string;
	content: string;
	author: string;
	tags?: string[];
	createdAt: string;
	replies: MemoReply[];
};

export const dummyMemos: Memo[] = [
	{
		id: "memo-1",
		title: "알림확인용이에용",
		content:
			"알림 테스트를 위한 메모입니다. 트위터 임베드나 다양한 콘텐츠를 포함할 수 있습니다.",
		author: "무공",
		tags: ["최신글", "취"],
		createdAt: "2023.02.16",
		replies: [],
	},
	{
		id: "memo-2",
		title: "붙임취씨",
		content:
			"여백 붙여넣기\n\n중국어공부\n드럼학원\n춤학원",
		author: "취",
		tags: ["최신글", "취"],
		createdAt: "2023.02.15",
		replies: [],
	},
	{
		id: "memo-3",
		title: "이런 식으로 아무말을 해봐",
		content:
			"내용내용~\n더많이\n더많이많이2",
		author: "무공",
		tags: ["최신글", "무공"],
		createdAt: "2023.02.14",
		replies: [
			{
				id: "memo-3-reply-1",
				content: "댓글 내용입니다.",
				author: "nisha",
				createdAt: "2023.02.14 15:30",
				reactions: {
					hearts: 2,
					likes: 1,
					comments: 1,
				},
			},
		],
	},
	{
		id: "memo-4",
		title: "영화 리뷰",
		content:
			"영화 리뷰 같은 것도 달 수 있구요\n별점으로 이 영화들의 어쩌고를 매겨보겠습니다",
		author: "무공",
		tags: ["최신글", "무공"],
		createdAt: "2023.02.13",
		replies: [],
	},
	{
		id: "memo-5",
		title: "2고정된 메모",
		content:
			"요즘 중독성 쩌는 넠 너너너넠 넉 넉",
		author: "무공",
		tags: ["최신글", "무공"],
		createdAt: "2023.02.12",
		replies: [],
	},
	{
		id: "memo-6",
		title: "제목 없음",
		content:
			"멤버 공개 게시글입니다.",
		author: "취",
		tags: ["최신글", "취"],
		createdAt: "2023.02.11",
		replies: [],
	},
	{
		id: "memo-7",
		title: "긴타래긴타래",
		content:
			"정기회의 회기는 100일을, 임시회의 회기는 30일을 초과할 수 없다.\n\n혼인과 가족생활은 개인의 존엄과 양성의 평등을 기초로 성립되고 유지되어야 하며, 국가는 이를 보장한다.\n\n대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다.",
		author: "무공",
		tags: ["최신글", "무공"],
		createdAt: "2023.02.10",
		replies: [
			{
				id: "memo-7-reply-1",
				content: "긴 타래에 대한 답글입니다.",
				author: "haneul",
				createdAt: "2023.02.10 16:20",
				reactions: {
					hearts: 5,
					likes: 3,
					comments: 2,
				},
			},
			{
				id: "memo-7-reply-2",
				content: "또 다른 답글입니다.",
				author: "jin",
				createdAt: "2023.02.10 18:45",
				reactions: {
					hearts: 1,
					likes: 1,
					comments: 0,
				},
			},
		],
	},
	{
		id: "memo-8",
		title: "메모오오오",
		content:
			"간단한 메모 내용입니다.",
		author: "무공",
		tags: ["최신글", "무공"],
		createdAt: "2023.02.09",
		replies: [],
	},
	{
		id: "memo-9",
		title: "주토피아2",
		content:
			"보고왔따",
		author: "무공",
		tags: ["최신글", "무공"],
		createdAt: "2023.02.08",
		replies: [],
	},
	{
		id: "memo-10",
		title: "테스트 메모",
		content:
			"테스트 344444",
		author: "취",
		tags: ["최신글", "취"],
		createdAt: "2023.02.07",
		replies: [],
	},
];
