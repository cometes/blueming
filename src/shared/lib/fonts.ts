export const getFontFormat = (url: string) => {
	const cleanUrl = url.split("?")[0];
	const ext = cleanUrl.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "woff2":
			return "woff2";
		case "woff":
			return "woff";
		case "ttf":
			return "truetype";
		case "otf":
			return "opentype";
		case "eot":
			return "embedded-opentype";
		default:
			return undefined;
	}
};

export const isFontFileUrl = (url: string) => {
	const cleanUrl = url.split("?")[0].toLowerCase();
	return /\.(woff2|woff|ttf|otf|eot)$/.test(cleanUrl);
};
