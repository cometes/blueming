"use client";

import { useCurrentEditor } from "@tiptap/react";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";

const TiptapToolbarWrapper = () => {
	const { editor } = useCurrentEditor();
	return <TiptapToolbar editor={editor} />;
};

export default TiptapToolbarWrapper;