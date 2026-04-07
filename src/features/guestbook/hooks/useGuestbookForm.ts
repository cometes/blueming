import { useState, useCallback, useMemo } from "react";
import {
	type CommentImage,
	createImageId,
} from "@/features/comment/hooks/useCommentForm";

// 기존 import 경로 호환을 위해 re-export
export type GuestbookImage = CommentImage;
export { createImageId };

const PIN_REGEX = /^\d{4}$/;
const MAX_IMAGE_COUNT = 8;

interface UseGuestbookFormProps {
	mode: "user" | "anon";
	onSuccess?: () => void;
}

export const useGuestbookForm = ({ mode }: UseGuestbookFormProps) => {
	const [displayName, setDisplayName] = useState("");
	const [pin, setPin] = useState("");
	const [message, setMessage] = useState("");
	const [images, setImages] = useState<GuestbookImage[]>([]);
	const [isSecret, setIsSecret] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canSubmit = useMemo(() => {
		if (!message.trim()) return false;
		return mode === "anon"
			? displayName.trim().length > 0 && PIN_REGEX.test(pin)
			: true;
	}, [displayName, message, pin, mode]);

	const resetForm = useCallback(() => {
		setDisplayName("");
		setPin("");
		setMessage("");
		setImages([]);
		setIsSecret(false);
		setIsSubmitting(false);
	}, []);

	const addImage = useCallback((url: string, file?: File) => {
		setImages((prev) => {
			if (prev.length >= MAX_IMAGE_COUNT) {
				return prev;
			}
			return [
				...prev,
				{
					id: createImageId(),
					url,
					file,
				},
			];
		});
	}, []);

	const removeImage = useCallback((id: string) => {
		setImages((prev) => {
			const targetImage = prev.find((img) => img.id === id);
			if (targetImage?.url.startsWith("blob:")) {
				URL.revokeObjectURL(targetImage.url);
			}
			return prev.filter((img) => img.id !== id);
		});
	}, []);

	const clearImages = useCallback(() => {
		setImages((prev) => {
			prev.forEach((img) => {
				if (img.url.startsWith("blob:")) {
					URL.revokeObjectURL(img.url);
				}
			});
			return [];
		});
	}, []);

	return {
		displayName,
		setDisplayName,
		pin,
		setPin,
		message,
		setMessage,
		images,
		setImages,
		isSecret,
		setIsSecret,
		isSubmitting,
		setIsSubmitting,
		canSubmit,
		resetForm,
		addImage,
		removeImage,
		clearImages,
	};
};
