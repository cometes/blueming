import { useRouter } from "next/navigation";

export const useMoveToPage = () => {
	const router = useRouter();

	const onClickMoveToPage = (path: string) => () => {
		router.push(path);
	};

	return {
		onClickMoveToPage,
	};
};
export const useMoveDataToPage = () => {
	const router = useRouter();

	const onClickMoveDataToPage = (path: string, data: string) => () => {
		const url = new URL(path, window.location.origin);
		url.searchParams.set('data', data);
		router.push(url.pathname + url.search);
	};

	return {
		onClickMoveDataToPage,
	};
};
