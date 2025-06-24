"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useMemo, useCallback } from "react";
import { createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { withInlines } from "@/hooks/editor/UseWithInline";
import { withImages } from "@/hooks/editor/UseWithImage";
import withVideo from "@/hooks/editor/UseWithVideo";
import Leaf from "../editor/Leaf";
import Viewer from "../editor/Viewer";

export default function WidgetProfile() {
	const { main } = useSettings();
	const profileData = main?.profile;

	// 프로필 데이터가 없으면 렌더링하지 않음
	if (!profileData) return null;

	// Slate editor setup for viewer
	const editor = useMemo(() => {
		return withVideo(
			withInlines(withImages(withHistory(withReact(createEditor()))))
		);
	}, []);

	const renderLeaf = useCallback((props: any) => {
		return <Leaf {...props} />;
	}, []);

	const renderElement = useCallback((props: any) => {
		return <Viewer {...props} />;
	}, []);

	// 자기소개 내용 파싱 및 렌더링
	const renderIntroduction = () => {
		if (!profileData.introduction) return "";

		try {
			const parsedContent = JSON.parse(profileData.introduction);
			const isEmpty = parsedContent.every((node: any) =>
				node.children?.every((child: any) => !child.text?.trim())
			);

			if (isEmpty) return "";

			return (
				<Slate
					editor={editor}
					initialValue={parsedContent}
					key={JSON.stringify(parsedContent)}
				>
					<Editable
						readOnly
						renderElement={renderElement}
						renderLeaf={renderLeaf}
						style={{ outline: "none" }}
					/>
				</Slate>
			);
		} catch {
			return profileData.introduction;
		}
	};

	return (
		<div className="widget-wrapper">
			<div className="w-full h-full flex flex-col justify-between">
				<div className="h-2/5/">
					<img
						className="w-full h-full object-cover"
						src={profileData.headerImage}
					/>
				</div>
				<div className="h-[45%] px-4 flex flex-col">
					<div className="aspect-[2/1] w-1/4 min-w-[70px] relative">
						{profileData.profileImage ? (
							<img
								className="block w-full aspect-[1/1] bg-gray-300 rounded-full absolute bottom-0"
								src={profileData.profileImage}
							/>
						) : (
							<img />
						)}
					</div>
					<p className="text-2xl font-bold text-main-text">
						{profileData.nickname}
					</p>
					<div className="text-sm mt-1 text-main-text">{renderIntroduction()}</div>
				</div>
				<div className="h-[15%] px-4">
					<p className="text-sm text-sub-text">{profileData.etc}</p>
				</div>
			</div>
		</div>
	);
}
