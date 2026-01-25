export type CommentImage = {
	id: string;
	url: string;
	file?: File;
};

export const createImageId = () =>
	`img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
