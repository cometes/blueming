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
import type { ThemeItem } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { setSettingsImport } from "@/queries/set/setSettingsImport";
import { setSettingsTheme, getSettingsTheme } from "@/queries/set/setSettingsTheme";

type ThemeData = ThemeItem;

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
	const { general, main, updateGeneral, updateMain, refreshSettings } = useSettings();
	const [themes, setThemes] = useState<ThemeData[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const loadThemes = useCallback(async () => {
		try {
			setIsLoading(true);

			// general.theme이 존재하면 로컬에서 로드, 없으면 API에서 로드
			if (general?.theme) {
				if (Array.isArray(general.theme)) {
					setThemes(general.theme);
				} else if (typeof general.theme === 'object' && general.theme !== null && 'value' in general.theme) {
					const themeValue = (general.theme as { value: unknown }).value;
					if (Array.isArray(themeValue)) {
						setThemes(themeValue);
					} else {
						setThemes([]);
					}
				} else {
					setThemes([]);
				}
			} else {
				const response = await getSettingsTheme();

				if (response.data && Array.isArray(response.data)) {
					setThemes(response.data);
				} else {
					setThemes([]);
				}
			}
		} catch {
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

	const createTheme = useCallback(async (name: string): Promise<boolean> => {
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
			const generalWithoutTheme = { ...general };
			delete generalWithoutTheme.theme;
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
			await refreshSettings?.({ broadcast: true });
			toast.success(`'${name}' 테마가 성공적으로 저장되었습니다.`);
			return true;
		} catch {
			toast.error("테마 생성 중 오류가 발생했습니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [themes, general, main, updateGeneral, refreshSettings]);

	const removeTheme = useCallback(async (id: string): Promise<boolean> => {
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
			await refreshSettings?.({ broadcast: true });
			toast.success(`'${themeToRemove.name}' 테마가 삭제되었습니다.`);
			return true;
		} catch {
			toast.error("테마 삭제 중 오류가 발생했습니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [themes, general, main, updateGeneral, refreshSettings]);

	const activateTheme = useCallback(async (id: string): Promise<boolean> => {
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

				await refreshSettings?.({ broadcast: true });
				toast.success(
					`'${themeToActivate.name}' 테마가 적용되고 저장되었습니다.`
				);
			} catch {
				toast.error(
					`'${themeToActivate.name}' 테마가 적용되었지만 서버 저장에 실패했습니다. 새로고침 시 이전 설정으로 돌아갈 수 있습니다.`
				);
			}

			return true;
		} catch {
			toast.error("테마 적용 중 오류가 발생했습니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [themes, updateGeneral, updateMain, refreshSettings]);

	// 테마 내보내기 기능
	const exportTheme = useCallback((id: string): string | null => {
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
		} catch {
			toast.error("테마 내보내기 중 오류가 발생했습니다.");
			return null;
		}
	}, [themes]);

	// 테마 가져오기 기능
	const importTheme = useCallback(async (themeJson: string): Promise<boolean> => {
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
			await refreshSettings?.({ broadcast: true });
			toast.success(`'${newTheme.name}' 테마를 가져왔습니다.`);
			return true;
		} catch {
			toast.error("유효하지 않은 테마 파일입니다.");
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [themes, general, main, updateGeneral, refreshSettings]);

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
