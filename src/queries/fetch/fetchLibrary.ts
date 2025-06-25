import axios from "axios";

export const fetchLibraryList = async () => {
	const result = await axios.get(
		"https://api-w5buphcleq-du.a.run.app/library/list"
	);

	const data = result.data;

	return {
		data,
	};
};

export const fetchLibrarySeries = async () => {
	const result = await axios.get(
		"https://api-w5buphcleq-du.a.run.app/library/series"
	);

	const data = result.data;

	return {
		data,
	};
};

export async function fetchLibraryDetail(id: string | string[]) {
	const request = await axios.get(
		`https://api-w5buphcleq-du.a.run.app/library/detail/${id}`
	);

	const data = request.data;

	return {
		data,
	};
}

export const fetchLibrarySeriesList = async (series: string | string[]) => {
	const result = await axios.get(
		`https://api-w5buphcleq-du.a.run.app/library/series/${series}`
	);

	const data = result.data;

	return {
		data,
	};
};

export const fetchLibraryTags = async () => {
	const result = await axios.get(
		"https://api-w5buphcleq-du.a.run.app/library/tags"
	);

	const data = result.data;

	return {
		data,
	};
};
