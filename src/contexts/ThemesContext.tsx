// Themes context manages saved theme presets
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	useCallback,
} from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { setSettingsImport } from "@/queries/set/setSettingsImport";
import {
	setSettingsTheme,
	getSettingsTheme,
	deleteSettingsTheme,
} from "@/queries/set/setSettingsTheme";

// Theme Data Interface (forward declaration)
interface ThemeData {
	id: string;
	name: string;
	createdAt: string;
	general: any; // 순환 참조 방지를 위해 any 사용
	main: any;
	exportedAt: string;
	version: string;
}

// Complete General Settings Interface
interface GeneralSettings {
	menu: {
		menus: Array<{
			id: string;
			uniqueId: string;
			allow: "all" | string;
			image: string;
			iconImage?: string;
			target: boolean;
			name: string;
			category: string;
			url?: string;
			subMenus?: string[];
		}>;
		design: {
			fontColor: string;
			backgroundColor: string;
			backgroundImage: string;
			align: "왼쪽" | "오른쪽";
			bgType: "없음" | "단색" | "이미지";
			textAlign: "왼쪽" | "가운데" | "오른쪽";
			type: "텍스트형" | "이미지형";
			logoType?: "텍스트" | "이미지" | "없음";
			logoImage?: string;
			logoText?: string;
			iconBarLogoImage?: string;
			iconBarLogoType?: "없음" | "이미지";
			iconBarBgType?: "없음" | "단색" | "이미지";
			iconBarBackgroundColor?: string;
			iconBarBackgroundImage?: string;
		};
	};
	design: {
		widget: {
			background: string;
			borderImage: string;
			blur: number;
			borderRadius: number;
			borderColor: string;
			borderWidth: number;
			borderStyle: "solid" | "double" | "dotted" | "dashed";
		};
		font: {
			bodyFontFamily: "Pretendard" | "Chosunilbo";
			titleFontFamily: "Pretendard" | "Chosunilbo";
			subFontColor: string;
			mainFontColor: string;
		};
		card: {
			boxShadow: string;
			borderRadius: number;
			translateY: number;
			borderWidth: number;
			borderStyle: "solid" | "double" | "dotted" | "dashed";
			blur: number;
			borderActiveColor: string;
			borderColor: string;
			background: string;
			type: "라이트" | "다크" | "커스텀";
		};
		background: {
			image: string;
			color: string;
			type: "기본" | "단색" | "그라데이션" | "이미지";
		};
	};
	general: {
		desc: string;
		logoImage: string;
		favicon: string;
		shareImage: string;
		secondaryColor: string;
		primaryColor: string;
		logoType: "없음" | "이미지";
		title: string;
	};
	theme?: ThemeData[];
}

// Complete Main Settings Interface
interface MainSettings {
	customLayout: {
		layout: Array<{
			w: number;
			h: number;
			x: number;
			y: number;
			i: string;
			maxW: number;
			maxH: number;
			moved: boolean;
			static: boolean;
		}>;
		mobileLayout?: Array<{
			w: number;
			h: number;
			x: number;
			y: number;
			i: string;
			maxW: number;
			maxH: number;
			moved: boolean;
			static: boolean;
		}>;
		widgets: Array<{
			id: string;
			type:
				| "로고"
				| "슬라이드 배너"
				| "띠 배너"
				| "공지"
				| "디데이";
			color: string;
		}>;
		usedColors: string[];
	};
	slide: {
		slides: Array<{
			id: string;
			uniqueId: string;
			url: string;
			image: string;
			target: boolean;
		}>;
	};
}

interface ThemesContextType {
	themes: ThemeData[];
	isLoading: boolean;
	loadThemes: () => void;
	createTheme: (name: string) => Promise<boolean>;
	removeTheme: (id: string) => Promise<boolean>;
	activateTheme: (id: string) => Promise<boolean>;
	exportTheme: (id: string) => string | null;
	importTheme: (themeJson: string) => Promise<boolean>;
}

const ThemesContext = createContext<ThemesContextType | undefined>(undefined);

export const useThemes = () => {
	const context = useContext(ThemesContext);
	if (!context) {
		throw new Error("useThemes must be used within a ThemesProvider");
	}
	return context;
};

// 로컬 스토리지 키 제거 - API 사용으로 변경

export const ThemesProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { general, main, updateGeneral, updateMain } = useSettings();
	const [themes, setThemes] = useState<ThemeData[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const loadThemes = useCallback(async () => {
		try {
			setIsLoading(true);

			// general.theme이 존재하면 로컬에서 로드, 없으면 API에서 로드
			if (general?.theme && Array.isArray(general.theme)) {
				setThemes(general.theme);
			} else {
				const response = await getSettingsTheme();

				if (response.data && Array.isArray(response.data)) {
					setThemes(response.data);
				} else {
					setThemes([]);
				}
			}
		} catch (err) {
			console.error("테마 로드 실패:", err);
			toast.error("저장된 테마를 불러오는 중 오류가 발생했습니다.");
			setThemes([]);
		} finally {
			setIsLoading(false);
		}
	}, [general]);

	// load on mount
	useEffect(() => {
		loadThemes();
	}, [loadThemes]);

	const createTheme = async (name: string): Promise<boolean> => {
		try {
			// 입력 유효성 검사
			if (!name || name.trim().length === 0) {
				toast.error("테마명을 입력해주세요.");
				return false;
			}

			if (name.trim().length > 50) {
				toast.error("테마명은 50자 이내로 입력해주세요.");
				return false;
			}

			// 중복 이름 검사
			if (themes.some((theme) => theme.name === name.trim())) {
				toast.error("이미 존재하는 테마명입니다.");
				return false;
			}

			// 현재 설정 상태 확인
			if (!general || !main) {
				toast.error("현재 설정을 불러올 수 없습니다.");
				return false;
			}

			setIsLoading(true);

			// 깊은 복사로 현재 설정 저장 (theme 속성 제외하여 circular reference 방지)
			const currentTime = new Date().toISOString();
			const { theme, ...generalWithoutTheme } = general;
			const newTheme: ThemeData = {
				id: Date.now().toString(),
				name: name.trim(),
				createdAt: currentTime,
				general: JSON.parse(JSON.stringify(generalWithoutTheme)),
				main: JSON.parse(JSON.stringify(main)),
				exportedAt: currentTime,
				version: "1.0",
			};

			// 업데이트된 테마 배열
			const updatedThemes = [...themes, newTheme];

			// API로 테마 배열 저장
			await setSettingsTheme(updatedThemes);

			// general 설정에도 테마 배열 업데이트
			const updatedGeneral = {
				...general,
				theme: updatedThemes,
			};

			// 전체 설정도 서버에 저장
			await setSettingsImport({
				general: updatedGeneral,
				main: main,
			});

			// 로컬 상태 업데이트
			updateGeneral(updatedGeneral);
			setThemes(updatedThemes);
			toast.success(`'${name}' 테마가 성공적으로 저장되었습니다.`);
			return true;
		} catch (err) {
			console.error("테마 생성 실패:", err);
			toast.error("테마 생성 중 오류가 발생했습니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const removeTheme = async (id: string): Promise<boolean> => {
		try {
			const themeToRemove = themes.find((t) => t.id === id);
			if (!themeToRemove) {
				toast.error("삭제할 테마를 찾을 수 없습니다.");
				return false;
			}

			setIsLoading(true);

			// 업데이트된 테마 배열
			const updatedThemes = themes.filter((t) => t.id !== id);

			// API로 테마 배열 저장
			await setSettingsTheme(updatedThemes);

			// general 설정에도 테마 배열 업데이트
			const updatedGeneral = {
				...general,
				theme: updatedThemes,
			};

			// 전체 설정도 서버에 저장
			await setSettingsImport({
				general: updatedGeneral,
				main: main,
			});

			// 로컬 상태 업데이트
			updateGeneral(updatedGeneral);
			setThemes(updatedThemes);
			toast.success(`'${themeToRemove.name}' 테마가 삭제되었습니다.`);
			return true;
		} catch (err) {
			console.error("테마 삭제 실패:", err);
			toast.error("테마 삭제 중 오류가 발생했습니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const activateTheme = async (id: string): Promise<boolean> => {
		try {
			const themeToActivate = themes.find((t) => t.id === id);
			if (!themeToActivate) {
				toast.error("적용할 테마를 찾을 수 없습니다.");
				return false;
			}

			setIsLoading(true);

			// 테마 데이터 유효성 검사
			if (!themeToActivate.general || !themeToActivate.main) {
				toast.error("테마 데이터가 손상되었습니다.");
				return false;
			}

			// 깊은 복사로 테마 적용 (현재 theme 배열은 유지)
			const generalCopy = JSON.parse(JSON.stringify(themeToActivate.general));
			const mainCopy = JSON.parse(JSON.stringify(themeToActivate.main));

			// 현재 테마 배열을 유지하면서 일반 설정 적용
			const generalWithThemes = {
				...generalCopy,
				theme: themes,
			};

			// 1. 즉시 로컬 상태 업데이트 (사용자 경험 향상)
			updateGeneral(generalWithThemes);
			updateMain(mainCopy);

			// 2. 서버에 설정 저장 (영구 보존)
			try {
				await setSettingsImport({
					general: generalWithThemes,
					main: mainCopy,
				});

				// BroadcastChannel을 통해 테마 변경사항을 다른 탭/창에 알림
				const channel = new BroadcastChannel("themeUpdated");
				channel.postMessage({
					general: generalWithThemes,
					main: mainCopy,
					themeName: themeToActivate.name,
					timestamp: Date.now(),
				});
				channel.close();

				toast.success(
					`'${themeToActivate.name}' 테마가 적용되고 저장되었습니다.`
				);
			} catch (serverError) {
				console.error("서버 저장 실패:", serverError);
				toast.error(
					`'${themeToActivate.name}' 테마가 적용되었지만 서버 저장에 실패했습니다. 새로고침 시 이전 설정으로 돌아갈 수 있습니다.`
				);
			}

			return true;
		} catch (err) {
			console.error("테마 적용 실패:", err);
			toast.error("테마 적용 중 오류가 발생했습니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	// 테마 내보내기 기능
	const exportTheme = (id: string): string | null => {
		try {
			const themeToExport = themes.find((t) => t.id === id);
			if (!themeToExport) {
				toast.error("내보낼 테마를 찾을 수 없습니다.");
				return null;
			}

			const exportData = {
				...themeToExport,
				exportedAt: new Date().toISOString(),
				version: "1.0",
			};

			return JSON.stringify(exportData, null, 2);
		} catch (err) {
			console.error("테마 내보내기 실패:", err);
			toast.error("테마 내보내기 중 오류가 발생했습니다.");
			return null;
		}
	};

	// 테마 가져오기 기능
	const importTheme = async (themeJson: string): Promise<boolean> => {
		try {
			const importedTheme = JSON.parse(themeJson);

			// 기본 유효성 검사
			if (
				!importedTheme.name ||
				!importedTheme.general ||
				!importedTheme.main
			) {
				toast.error("유효하지 않은 테마 파일입니다.");
				return false;
			}

			// 새로운 ID와 생성 시간으로 테마 생성
			const currentTime = new Date().toISOString();
			const newTheme: ThemeData = {
				id: Date.now().toString(),
				name: `${importedTheme.name} (가져옴)`,
				createdAt: currentTime,
				general: importedTheme.general,
				main: importedTheme.main,
				exportedAt: currentTime,
				version: "1.0",
			};

			setIsLoading(true);

			// 업데이트된 테마 배열
			const updatedThemes = [...themes, newTheme];

			// API로 테마 배열 저장
			await setSettingsTheme(updatedThemes);

			// general 설정에도 테마 배열 업데이트
			const updatedGeneral = {
				...general,
				theme: updatedThemes,
			};

			// 전체 설정도 서버에 저장
			await setSettingsImport({
				general: updatedGeneral,
				main: main,
			});

			// 로컬 상태 업데이트
			updateGeneral(updatedGeneral);
			setThemes(updatedThemes);
			toast.success(`'${newTheme.name}' 테마를 가져왔습니다.`);
			return true;
		} catch (err) {
			console.error("테마 가져오기 실패:", err);
			toast.error("유효하지 않은 테마 파일입니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const value = useMemo(
		() => ({
			themes,
			isLoading,
			loadThemes,
			createTheme,
			removeTheme,
			activateTheme,
			exportTheme,
			importTheme,
		}),
		[
			themes,
			isLoading,
			loadThemes,
			createTheme,
			removeTheme,
			activateTheme,
			exportTheme,
			importTheme,
		]
	);

	return (
		<ThemesContext.Provider value={value}>{children}</ThemesContext.Provider>
	);
};
