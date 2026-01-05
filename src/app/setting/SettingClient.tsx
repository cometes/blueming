"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import AdminRoute from "@/components/common/AdminRoute";
import SettingLayout from "@/components/layout/SettingLayout";

const GeneralSettingClient = dynamic(() => import("./general/GeneralSettingClient"));
const DesignSettingClient = dynamic(() => import("./design/DesignSettingClient"));
const MenuSettingClient = dynamic(() => import("./menu/MenuSettingClient"));
const ThemeSettingClient = dynamic(() => import("./theme/ThemeSettingClient"));
const CustomLayoutClient = dynamic(() => import("./customLayout/CustomLayoutClient"));
const NoticeSettingClient = dynamic(() => import("./notice/NoticeSettingClient"));
const ProfileSettingClient = dynamic(() => import("./profile/ProfileSettingClient"));
const SlideSettingClient = dynamic(() => import("./slide/SlideSettingClient"));
const DdaySettingClient = dynamic(() => import("./dday/DdaySettingClient"));
const EffectSettingClient = dynamic(() => import("./effect/EffectSettingClient"));

type SettingSection = {
	id: string;
	label: string;
	title: string;
	desc: string;
	Component: ComponentType;
};

type SettingGroup = {
	title: string;
	items: SettingSection[];
};

export default function SettingClient() {
	const settingGroups: SettingGroup[] = useMemo(
		() => [
			{
				title: "홈페이지 설정",
				items: [
					{
						id: "general",
						label: "홈페이지 설정",
						title: "홈페이지 기본 설정",
						desc: "홈페이지의 기본 정보와 디자인을 설정할 수 있습니다.",
						Component: GeneralSettingClient,
					},
					{
						id: "design",
						label: "전체 디자인 설정",
						title: "전체 디자인 설정",
						desc: "홈페이지의 전체적인 디자인을 설정할 수 있습니다.",
						Component: DesignSettingClient,
					},
					{
						id: "menu",
						label: "메뉴 디자인 설정",
						title: "메뉴 디자인 설정",
						desc: "메뉴의 디자인과 구성을 설정할 수 있습니다.",
						Component: MenuSettingClient,
					},
					{
						id: "effect",
						label: "배경 이펙트 설정",
						title: "배경 이펙트 설정",
						desc: "홈페이지의 배경 이펙트를 설정할 수 있습니다.",
						Component: EffectSettingClient,
					},
					{
						id: "theme",
						label: "테마 설정",
						title: "테마 설정",
						desc: "홈페이지의 테마를 설정할 수 있습니다.",
						Component: ThemeSettingClient,
					},
				],
			},
			{
				title: "메인 페이지 설정",
				items: [
					{
						id: "mainLayout",
						label: "메인 레이아웃 설정",
						title: "메인 레이아웃 설정",
						desc: "메인 페이지의 레이아웃을 편집할 수 있습니다.",
						Component: CustomLayoutClient,
					},
					{
						id: "notice",
						label: "메인 공지 설정",
						title: "메인 공지 설정",
						desc: "메인 페이지의 공지사항을 설정할 수 있습니다.",
						Component: NoticeSettingClient,
					},
					{
						id: "profile",
						label: "프로필 설정",
						title: "프로필 설정",
						desc: "사용자 프로필 정보를 설정할 수 있습니다.",
						Component: ProfileSettingClient,
					},
					{
						id: "slide",
						label: "슬라이드 배너 설정",
						title: "슬라이드 배너 설정",
						desc: "슬라이드 배너를 설정할 수 있습니다.",
						Component: SlideSettingClient,
					},
					{
						id: "dday",
						label: "디데이 설정",
						title: "디데이 설정",
						desc: "디데이 기능을 설정할 수 있습니다.",
						Component: DdaySettingClient,
					},
				],
			},
		],
		[]
	);

	const allSections = useMemo(
		() => settingGroups.flatMap((group) => group.items),
		[settingGroups]
	);

	const [activeSection, setActiveSection] = useState(allSections[0]?.id || "");
	const currentSection =
		allSections.find((section) => section.id === activeSection) ||
		allSections[0];
	const sidebarGroups = useMemo(
		() =>
			settingGroups.map((group) => ({
				title: group.title,
				items: group.items.map((item) => ({
					id: item.id,
					label: item.label,
				})),
			})),
		[settingGroups]
	);

	return (
		<AdminRoute>
			<SettingLayout
				sidebarGroups={sidebarGroups}
				activeSection={activeSection}
				onSectionChange={setActiveSection}
				title={currentSection?.title || ""}
				description={currentSection?.desc || ""}
			>
				{currentSection ? <currentSection.Component /> : null}
			</SettingLayout>
		</AdminRoute>
	);
}
