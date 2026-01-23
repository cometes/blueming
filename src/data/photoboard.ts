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
	tags?: string[];
};
