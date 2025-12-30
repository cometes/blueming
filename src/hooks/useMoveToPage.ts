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
		router.push(
			{
				pathname: path,
				query: {
					data,
				},
			},
			path
		);
	};

	return {
		onClickMoveDataToPage,
	};
};
