"use client";

import type { ComponentType } from "react";
import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import AdminRoute from "@/components/common/AdminRoute";
import SettingLayout from "@/components/layout/SettingLayout";
import { SettingStatusProvider } from "@/contexts/SettingStatusContext";
import { SettingHeaderActionProvider } from "@/contexts/SettingHeaderActionContext";
import { useAdmin } from "@/features/admin/hooks/useAdmin";

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
const StickerBoardSettingClient = dynamic(
	() => import("./stickerBoard/StickerBoardSettingClient")
);
const ImageWidgetSettingClient = dynamic(
	() => import("./imageWidget/ImageWidgetSettingClient")
);
const WeatherClockSettingClient = dynamic(
	() => import("./weatherClock/WeatherClockSettingClient")
);
const AccountSettingClient = dynamic(
	() => import("./account/AccountSettingClient")
);
const AssetSettingClient = dynamic(() => import("./asset/AssetSettingClient"));
const MusicSettingClient = dynamic(() => import("./music/MusicSettingClient"));
const UserManagementSettingClient = dynamic(
	() => import("./userManagement/UserManagementClient")
);

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

interface SettingClientProps {
	initialSection?: string;
}

export default function SettingClient({ initialSection }: SettingClientProps) {
	const router = useRouter();
	const { isAdmin } = useAdmin();
	const settingGroups: SettingGroup[] = useMemo(
		() => {
			const groups: SettingGroup[] = [
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
						{
							id: "stickerBoard",
							label: "스티커보드 설정",
							title: "스티커보드 설정",
							desc: "메인 페이지 스티커보드를 설정할 수 있습니다.",
							Component: StickerBoardSettingClient,
						},
						{
							id: "imageWidget",
							label: "이미지 위젯 설정",
							title: "이미지 위젯 설정",
							desc: "메인 페이지 이미지 위젯을 설정할 수 있습니다.",
							Component: ImageWidgetSettingClient,
						},
						{
							id: "weatherClock",
							label: "날씨&시계 설정",
							title: "날씨&시계 설정",
							desc: "메인 페이지 날씨&시계 위젯을 설정할 수 있습니다.",
							Component: WeatherClockSettingClient,
						},
						{
							id: "music",
							label: "음악 플레이어 설정",
							title: "음악 플레이어 설정",
							desc: "유튜브 링크·재생목록으로 플로팅 음악 플레이어를 설정할 수 있습니다.",
							Component: MusicSettingClient,
						},
					],
				},
				{
					title: "관리",
					items: [
						{
							id: "userManagement",
							label: "회원 관리",
							title: "회원 관리",
							desc: "서비스에 가입한 회원을 관리하고 가입 설정을 변경할 수 있습니다.",
							Component: UserManagementSettingClient,
						},
						{
							id: "account",
							label: "계정 관리",
							title: "계정 관리",
							desc: "AI 연동 키를 관리할 수 있습니다.",
							Component: AccountSettingClient,
						},
						{
							id: "asset",
							label: "에셋 관리",
							title: "에셋 관리",
							desc: "이미지 및 파일 에셋을 관리할 수 있습니다.",
							Component: AssetSettingClient,
						},
					],
				},
			];

			return isAdmin ? groups : groups.filter((group) => group.title !== "관리");
		},
		[isAdmin]
	);

	const allSections = useMemo(
		() => settingGroups.flatMap((group) => group.items),
		[settingGroups]
	);

	const defaultSectionId = allSections[0]?.id || "";
	const initialActiveSection =
		initialSection && allSections.some((section) => section.id === initialSection)
			? initialSection
			: defaultSectionId;
	const [activeSection, setActiveSection] = useState(initialActiveSection);
	const isValidSection = useMemo(
		() => (sectionId: string) =>
			allSections.some((section) => section.id === sectionId),
		[allSections]
	);
	useEffect(() => {
		if (!initialSection) return;

		if (isValidSection(initialSection)) {
			if (initialSection !== activeSection) {
				setActiveSection(initialSection);
			}
			return;
		}

		if (defaultSectionId) {
			setActiveSection(defaultSectionId);
			router.replace(`/setting/${defaultSectionId}`);
		}
	}, [activeSection, defaultSectionId, initialSection, isValidSection, router]);

	const handleSectionChange = (sectionId: string) => {
		setActiveSection(sectionId);
		router.push(`/setting/${sectionId}`);
	};
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
			<SettingStatusProvider>
				<SettingHeaderActionProvider>
					<SettingLayout
						sidebarGroups={sidebarGroups}
						activeSection={activeSection}
						onSectionChange={handleSectionChange}
						title={currentSection?.title || ""}
						description={currentSection?.desc || ""}
					>
						{currentSection ? <currentSection.Component /> : null}
					</SettingLayout>
				</SettingHeaderActionProvider>
			</SettingStatusProvider>
		</AdminRoute>
	);
}
