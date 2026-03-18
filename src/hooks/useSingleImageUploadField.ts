"use client";

import { useCallback, useEffect, useState } from "react";

export function useSingleImageUploadField() {
	const [imageUrl, setImageUrl] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);

	const clearImage = useCallback(() => {
		setImageUrl((prev) => {
			if (prev.startsWith("blob:")) {
				URL.revokeObjectURL(prev);
			}
			return "";
		});
		setImageFile(null);
	}, []);

	const setFromFile = useCallback((file: File) => {
		setImageUrl((prev) => {
			if (prev.startsWith("blob:")) {
				URL.revokeObjectURL(prev);
			}
			return URL.createObjectURL(file);
		});
		setImageFile(file);
	}, []);

	const setFromUrl = useCallback((url: string) => {
		setImageUrl((prev) => {
			if (prev.startsWith("blob:") && prev !== url) {
				URL.revokeObjectURL(prev);
			}
			return url;
		});
		setImageFile(null);
	}, []);

	useEffect(() => {
		return () => {
			if (imageUrl.startsWith("blob:")) {
				URL.revokeObjectURL(imageUrl);
			}
		};
	}, [imageUrl]);

	return {
		imageUrl,
		imageFile,
		setFromFile,
		setFromUrl,
		clearImage,
		setImageFile,
	};
}
