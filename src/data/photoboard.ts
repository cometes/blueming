export type PhotoBoardAuthor = {
	id: string;
	name: string;
	avatarUrl: string;
};

export type PhotoBoardPost = {
	id: string;
	author: PhotoBoardAuthor;
	createdAt: string;
	imageUrl: string;
	caption: string;
	likeCount: number;
};

export const photoBoardPosts: PhotoBoardPost[] = [
	{
		id: "pb-001",
		author: {
			id: "user-01",
			name: "Nora",
			avatarUrl:
				"https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-06T03:12:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
		caption: "Golden hour over the ridge. The wind was cold but the light was unreal.",
		likeCount: 314,
	},
	{
		id: "pb-002",
		author: {
			id: "user-02",
			name: "Haru",
			avatarUrl:
				"https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-05T21:40:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1100&q=80",
		caption: "Quiet studio morning. Coffee, canvas, and a lot of paint on my hands.",
		likeCount: 128,
	},
	{
		id: "pb-003",
		author: {
			id: "user-03",
			name: "Mira",
			avatarUrl:
				"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-05T15:02:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
		caption: "Snowfield silence. Every step sounded like breaking glass.",
		likeCount: 512,
	},
	{
		id: "pb-004",
		author: {
			id: "user-04",
			name: "Jun",
			avatarUrl:
				"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-05T09:18:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
		caption: "A long road, a soft haze, and a playlist that matched the sky.",
		likeCount: 89,
	},
	{
		id: "pb-005",
		author: {
			id: "user-05",
			name: "Eli",
			avatarUrl:
				"https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-04T23:30:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
		caption: "Blue city glow. The kind of night that feels like a movie still.",
		likeCount: 402,
	},
	{
		id: "pb-006",
		author: {
			id: "user-06",
			name: "Sora",
			avatarUrl:
				"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-04T17:05:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
		caption: "Salt air and a shoreline that never ends. I stayed until dusk.",
		likeCount: 223,
	},
	{
		id: "pb-007",
		author: {
			id: "user-07",
			name: "Ari",
			avatarUrl:
				"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-04T08:44:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
		caption: "Forest trail loop. Found a cabin with smoke curling out of the chimney.",
		likeCount: 176,
	},
	{
		id: "pb-008",
		author: {
			id: "user-08",
			name: "Noah",
			avatarUrl:
				"https://images.unsplash.com/photo-1545996124-0501ebae84d0?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-03T20:12:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
		caption: "Wave after wave. I could have watched this for hours.",
		likeCount: 631,
	},
	{
		id: "pb-009",
		author: {
			id: "user-09",
			name: "Yuna",
			avatarUrl:
				"https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-03T11:22:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
		caption: "City grid at noon. Shadows made perfect lines between the buildings.",
		likeCount: 57,
	},
	{
		id: "pb-010",
		author: {
			id: "user-10",
			name: "Rin",
			avatarUrl:
				"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
		},
		createdAt: "2026-01-02T19:05:00.000Z",
		imageUrl:
			"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
		caption: "Green canopy above, soft light below. The air smelled like cedar.",
		likeCount: 284,
	},
];
