"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useMemo } from "react";
import Image from "next/image";
import { isRichTextEmpty, renderRichText } from "@/shared/lib/richText";

interface ProfileData {
	headerImage?: string;
	profileImage?: string;
	nickname?: string;
	introduction?: string;
	etc?: string;
}

export default function WidgetProfile() {
	const { main } = useSettings();
	const profileData: ProfileData | undefined = main?.profile;

	// useMemo는 조건문보다 먼저 호출되어야 함 (React Hooks 규칙)
	const introductionHtml = useMemo(
		() => profileData?.introduction ? renderRichText(profileData.introduction) : "",
		[profileData?.introduction]
	);

	// 프로필 데이터가 없으면 빈 컴포넌트 반환
	if (!profileData) {
		return <div className="widget-wrapper" />;
	}

	const hasIntroduction =
		introductionHtml && !isRichTextEmpty(introductionHtml ?? "");

	return (
		<div className="widget-wrapper">
			<div className="w-full h-full flex flex-col justify-between">
				<div className="h-2/5">
					{profileData.headerImage && (
						<Image
							alt="헤더 이미지"
							className="w-full h-full object-cover"
							src={profileData.headerImage}
							width={400}
							height={200}
						/>
					)}
				</div>
				<div className="h-[45%] px-4 flex flex-col">
					<div className="aspect-[2/1] w-1/4 min-w-[70px] relative">
						{profileData.profileImage && (
							<Image
								alt="프로필 이미지"
								className="block w-full aspect-[1/1] bg-gray-300 rounded-full absolute bottom-0"
								src={profileData.profileImage}
								width={70}
								height={70}
							/>
						)}
					</div>
					<p className="text-2xl font-bold text-main-text font-title">
						{profileData.nickname}
					</p>
					<div className="text-sm mt-1 text-main-text">
						{hasIntroduction && (
							<div dangerouslySetInnerHTML={{ __html: introductionHtml }} />
						)}
					</div>
				</div>
				<div className="h-[15%] px-4">
					<p className="text-sm text-sub-text">{profileData.etc}</p>
				</div>
			</div>
		</div>
	);
}
