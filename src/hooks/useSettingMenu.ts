import { useForm } from "react-hook-form";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import {
	useSettings,
	type MenuItem,
	type MenuDesign,
} from "@/contexts/SettingsContext";
import { setSettingsGeneralMenu } from "@/queries/set/setSettingsGeneralMenu";
import { yupResolver } from "@hookform/resolvers/yup";
import type { AnyObjectSchema } from "yup";
import { schemaAddMenu } from "@/lib/schema";

const defaultMenuDesign: MenuDesign = {
	align: "왼쪽",
	type: "텍스트형",
	fontColor: "#000000",
	textAlign: "가운데",
	logoType: "텍스트",
	logoImage: "",
	logoText: "",
	bgType: "없음",
	backgroundColor: "#ffffff",
	backgroundImage: "",
	iconBarLogoImage: "",
	iconBarLogoType: "없음",
	iconBarBgType: "없음",
	iconBarBackgroundColor: "#ffffff",
	iconBarBackgroundImage: "",
};

export const useSettingMenu = () => {
	const { general, updateGeneral, refreshSettings } = useSettings();
	const menuData = general?.menu;

	const boardArr = [
		{ label: "라이브러리", value: "라이브러리" },
		{ label: "아카이브", value: "아카이브" },
		{ label: "갤러리", value: "갤러리" },
		{ label: "메모", value: "메모" },
		{ label: "포토보드", value: "포토보드" },
		{ label: "방명록", value: "방명록" },
		{ label: "설정", value: "설정" },
	];

	const menuTypes = ["없음", "텍스트", "이미지"];
	const align = ["왼쪽", "오른쪽"];
	const textAlign = ["왼쪽", "가운데", "오른쪽"];
	const bgType = ["없음", "단색", "이미지"];

	const [currentMenuTab, setCurrentMenuTab] = useState<
		"posting" | "folder" | "custom"
	>("posting");
	const [bgThumbnail, setBgThumnail] = useState("");

	const [currentMenuList, setCurrentMenuList] = useState<MenuItem[]>([]);
	const [menuDesign, setMenuDesign] = useState<MenuDesign>(defaultMenuDesign);
	const [isSyncing, setIsSyncing] = useState(true);
	const baselineMenuDesign = useMemo(
		() => ({
			...defaultMenuDesign,
			...(menuData?.design || {}),
		}),
		[menuData?.design]
	);
	const baselineMenuList = useMemo(
		() => menuData?.menus || [],
		[menuData?.menus]
	);
	const isDirty = useMemo(
		() => {
			if (isSyncing) return false;
			return (
				JSON.stringify(menuDesign) !== JSON.stringify(baselineMenuDesign) ||
				JSON.stringify(currentMenuList) !== JSON.stringify(baselineMenuList)
			);
		},
		[
			menuDesign,
			baselineMenuDesign,
			currentMenuList,
			baselineMenuList,
			isSyncing,
		]
	);

	// Load initial data
	useEffect(() => {
		setIsSyncing(true);
		if (menuData) {
			if (menuData.menus && Array.isArray(menuData.menus)) {
				setCurrentMenuList(menuData.menus);
			}
			if (menuData.design) {
				setMenuDesign({
					...defaultMenuDesign,
					...menuData.design,
				});
			}
		}
		setIsSyncing(false);
	}, [menuData]);

	// Form for adding/editing menu items
	type MenuFormValues = {
		name: string;
		isPublic?: boolean;
		openInNewTab?: boolean;
		image?: string;
		iconImage?: string;
		category?: string;
		url?: string;
		subMenus?: MenuItem["subMenus"];
	};

	const resolverSchema = schemaAddMenu[currentMenuTab] as AnyObjectSchema;
	const { setValue, getValues, handleSubmit, formState, reset } =
		useForm<MenuFormValues>({
			mode: "onSubmit",
			resolver: yupResolver(resolverSchema),
		});

	// Reset form when menu tab changes
	useEffect(() => {
		reset();
	}, [currentMenuTab, reset]);

	const updateMenuDesign = useCallback(
		(field: keyof MenuDesign, value: string) => {
			setMenuDesign((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[]
	);

	const updateMenuSetting = useCallback(
		(path: string, value: string) => {
			if (path === "background.color") {
				updateMenuDesign("backgroundColor", value);
			} else if (path === "font.color") {
				updateMenuDesign("fontColor", value);
			} else if (path === "background.image") {
				updateMenuDesign("backgroundImage", value);
			} else if (path === "logo.image") {
				updateMenuDesign("logoImage", value);
			} else if (path === "logo.text") {
				updateMenuDesign("logoText", value);
			} else if (path === "iconbar.logo.image") {
				updateMenuDesign("iconBarLogoImage", value);
			} else if (path === "iconbar.logo.type") {
				updateMenuDesign("iconBarLogoType", value);
			} else if (path === "iconbar.bg.type") {
				updateMenuDesign("iconBarBgType", value);
			} else if (path === "iconbar.background.color") {
				updateMenuDesign("iconBarBackgroundColor", value);
			} else if (path === "iconbar.background.image") {
				updateMenuDesign("iconBarBackgroundImage", value);
			}
		},
		[updateMenuDesign]
	);

	const handleAddMenu = useCallback(
		(data: MenuFormValues) => {
			if (currentMenuList.length >= 8) {
				toast.error("최대 8개의 메뉴만 추가할 수 있습니다.");
				return;
			}

			const newMenuData: MenuItem = {
				id: `${currentMenuList.length + 1}`,
				uniqueId: crypto.randomUUID(),
				name: data.name,
				type: currentMenuTab,
				isPublic: data.isPublic ?? true,
				openInNewTab: data.openInNewTab ?? false,
				allow: data.isPublic ? "all" : "private",
				image: data.image || "",
				iconImage: data.iconImage || "",
				target: data.openInNewTab ?? false,
				category:
					data.category ||
					(currentMenuTab === "folder"
						? "폴더"
						: currentMenuTab === "custom"
							? "커스텀"
							: ""),
				url: data.url || "",
				subMenus: data.subMenus || [],
			};

			setCurrentMenuList((prev) => [...prev, newMenuData]);
			reset();
		},
		[currentMenuList, currentMenuTab, reset]
	);

	const handleDeleteMenu = useCallback((uniqueId: string) => {
		setCurrentMenuList((prev) => {
			const filtered = prev.filter((m) => m.uniqueId !== uniqueId);
			return filtered.map((m, index) => ({ ...m, id: `${index + 1}` }));
		});
	}, []);

	const handleUpdateMenu = useCallback(
		(index: number, updatedMenu: Partial<MenuItem>) => {
			setCurrentMenuList((prev) => {
				const newList = [...prev];
				newList[index] = { ...newList[index], ...updatedMenu };
				return newList;
			});
		},
		[]
	);

	const handleDragEnd = useCallback((result: DropResult) => {
		const { destination, source } = result;
		if (!destination || destination.index === source.index) return;

		setCurrentMenuList((prev) => {
			const newList = Array.from(prev);
			const [movedItem] = newList.splice(source.index, 1);
			newList.splice(destination.index, 0, movedItem);
			return newList.map((m, index) => ({ ...m, id: `${index + 1}` }));
		});
	}, []);

	const handleReset = useCallback(async () => {
		try {
			setMenuDesign(defaultMenuDesign);
			setCurrentMenuList([]);
			reset();

			const menuData = {
				design: defaultMenuDesign,
				menus: [],
			};

			const response = await setSettingsGeneralMenu(menuData);
			updateGeneral(response.general);
			await refreshSettings?.({ broadcast: true });

			const channel = new BroadcastChannel("menuSettingsUpdated");
			channel.postMessage({
				menuSettings: response.general,
				timestamp: Date.now(),
			});
			channel.close();

			toast.success("초기화되었습니다.");
		} catch {
			toast.error("초기화에 실패했습니다.");
		}
	}, [reset, updateGeneral, refreshSettings]);

	const handleSave = useCallback(async (next?: { design?: MenuDesign; menus?: MenuItem[] }) => {
		try {
			const nextDesign = next?.design ?? menuDesign;
			const nextMenus = next?.menus ?? currentMenuList;
			const preparedMenuDesign = {
				...nextDesign,
				backgroundColor:
					nextDesign.bgType === "없음"
						? "rgba(0, 0, 0, 0)"
						: nextDesign.backgroundColor,
			};

			const menuData = {
				design: preparedMenuDesign,
				menus: nextMenus,
			};

			const response = await setSettingsGeneralMenu(menuData);
			updateGeneral(response.general);
			await refreshSettings?.({ broadcast: true });

			const channel = new BroadcastChannel("menuSettingsUpdated");
			channel.postMessage({
				menuSettings: response.general,
				timestamp: Date.now(),
			});
			channel.close();

			toast.success("저장되었습니다.");
		} catch {
			toast.error("저장에 실패했습니다.");
		}
	}, [menuDesign, currentMenuList, updateGeneral, refreshSettings]);

	return {
		handleSubmit,
		handleAddMenu,
		reset,
		currentMenuTab,
		setCurrentMenuTab,
		setValue,
		formState,
		getValues,
		boardArr,
		handleUpdateMenu,
		handleDeleteMenu,
		handleDragEnd,
		menus: currentMenuList,
		menuTypes,
		align,
		textAlign,
		bgType,
		updateMenuSetting,
		menuDesign,
		updateMenuDesign,
		handleReset,
		handleSave,
		bgThumbnail,
		setBgThumnail,
		isDirty,
	};
};
