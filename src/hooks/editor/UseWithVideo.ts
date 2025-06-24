const withVideo = (editor) => {
	const { isVoid } = editor;

	editor.isVoid = (element) => {
		return element.type === "video" ? true : isVoid(element);
	};

	return editor;
};

export default withVideo;
