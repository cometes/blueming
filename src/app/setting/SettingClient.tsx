"use client";

import { useState } from "react";
import AdminRoute from "@/components/common/AdminRoute";
import SettingLayout from "@/components/layout/SettingLayout";
import GeneralSettingClient from "./general/GeneralSettingClient";
import DesignSettingClient from "./design/DesignSettingClient";
import MenuSettingClient from "./menu/MenuSettingClient";
import ThemeSettingClient from "./theme/ThemeSettingClient";
import CustomLayoutClient from "./customLayout/CustomLayoutClient";
import NoticeSettingClient from "./notice/NoticeSettingClient";
import ProfileSettingClient from "./profile/ProfileSettingClient";

const EffectSetting = () => (
	<div className="p-6 bg-card rounded-lg">
		<h3 className="text-xl font-bold mb-4">기타 설정</h3>
		<p className="text-sub-text">
			홈페이지의 기타 효과와 설정을 관리할 수 있습니다.
		</p>
	</div>
);

const FreeBoardSetting = () => (
	<div className="p-6 bg-card rounded-lg">
		<h3 className="text-xl font-bold mb-4">스티커보드 설정</h3>
		<p className="text-sub-text">스티커보드의 설정을 관리할 수 있습니다.</p>
	</div>
);



const SlideSetting = () => (
	<div className="p-6 bg-card rounded-lg">
		<h3 className="text-xl font-bold mb-4">슬라이드 배너 설정</h3>
		<p className="text-sub-text">슬라이드 배너를 설정할 수 있습니다.</p>
	</div>
);

const DdaySetting = () => (
	<div className="p-6 bg-card rounded-lg">
		<h3 className="text-xl font-bold mb-4">디데이 설정</h3>
		<p className="text-sub-text">디데이 기능을 설정할 수 있습니다.</p>
	</div>
);

export default function SettingClient() {
	const [activeSection, setActiveSection] = useState("general");

	const sections = {
		// 일반 설정 그룹
		general: {
			component: <GeneralSettingClient />,
			title: "홈페이지 기본 설정",
			desc: "홈페이지의 기본 정보와 디자인을 설정할 수 있습니다.",
		},
		design: {
			component: <DesignSettingClient />,
			title: "전체 디자인 설정",
			desc: "홈페이지의 전체적인 디자인을 설정할 수 있습니다.",
		},
		menu: {
			component: <MenuSettingClient />,
			title: "메뉴 디자인 설정",
			desc: "메뉴의 디자인과 구성을 설정할 수 있습니다.",
		},
		effect: {
			component: <EffectSetting />,
			title: "기타 설정",
			desc: "홈페이지의 기타 효과와 설정을 관리할 수 있습니다.",
		},
		theme: {
			component: <ThemeSettingClient />,
			title: "테마 설정",
			desc: "홈페이지의 테마를 설정할 수 있습니다.",
		},

		// 메인 설정 그룹
		mainLayout: {
			component: <CustomLayoutClient />,
			title: "메인 레이아웃 설정",
			desc: "메인 페이지의 레이아웃을 편집할 수 있습니다.",
		},
		freeBoard: {
			component: <FreeBoardSetting />,
			title: "스티커보드 설정",
			desc: "스티커보드의 설정을 관리할 수 있습니다.",
		},
		notice: {
			component: <NoticeSettingClient />,
			title: "메인 공지 설정",
			desc: "메인 페이지의 공지사항을 설정할 수 있습니다.",
		},
		profile: {
			component: <ProfileSettingClient />,
			title: "프로필 설정",
			desc: "사용자 프로필 정보를 설정할 수 있습니다.",
		},
		slide: {
			component: <SlideSetting />,
			title: "슬라이드 배너 설정",
			desc: "슬라이드 배너를 설정할 수 있습니다.",
		},
		dday: {
			component: <DdaySetting />,
			title: "디데이 설정",
			desc: "디데이 기능을 설정할 수 있습니다.",
		},
	};

	const sidebarGroups = [
		{
			title: "홈페이지 설정",
			items: [
				{ id: "general", label: "홈페이지 설정" },
				{ id: "design", label: "전체 디자인 설정" },
				{ id: "menu", label: "메뉴 디자인 설정" },
				{ id: "effect", label: "기타 설정" },
				{ id: "theme", label: "테마 설정" },
			],
		},
		{
			title: "메인 페이지 설정",
			items: [
				{ id: "mainLayout", label: "메인 레이아웃 설정" },
				{ id: "freeBoard", label: "스티커보드 설정" },
				{ id: "notice", label: "메인 공지 설정" },
				{ id: "profile", label: "프로필 설정" },
				{ id: "slide", label: "슬라이드 배너 설정" },
				{ id: "dday", label: "디데이 설정" },
			],
		},
	];

	const currentSection =
		sections[activeSection as keyof typeof sections] || sections.general;

	return (
		<AdminRoute>
			<SettingLayout
				sidebarGroups={sidebarGroups}
				activeSection={activeSection}
				onSectionChange={setActiveSection}
				title={currentSection.title}
				description={currentSection.desc}
			>
				{currentSection.component}
			</SettingLayout>
		</AdminRoute>
	);
}
