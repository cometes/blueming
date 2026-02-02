/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Save, Trash2, RefreshCw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { setSettingsMainWeatherClock } from "@/queries/set/setSettingsMainWeatherClock";
import { generateCityIllustration } from "@/queries/generateCityIllustration";

export default function WeatherClockSettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;

	const [city, setCity] = useState("Seoul");
	const [isSyncing, setIsSyncing] = useState(true);
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [backgroundImage, setBackgroundImage] = useState("");
	const [backgroundImageCity, setBackgroundImageCity] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [prompt, setPrompt] = useState("");

	const defaultPrompt = useMemo(
		() =>
			`Create a clean, modern cityscape illustration of ${
				city.trim() || "the city"
			}. Soft lighting, minimal clouds, clear sky, vibrant yet calm colors. No text.`,
		[city]
	);

	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const baseline = settings.main?.weatherClock || {
			city: "Seoul",
			backgroundImage: "",
			backgroundImageCity: "",
		};
		return (
			city !== baseline.city ||
			backgroundImage !== (baseline.backgroundImage || "") ||
			backgroundImageCity !== (baseline.backgroundImageCity || "")
		);
	}, [
		city,
		backgroundImage,
		backgroundImageCity,
		settings.main?.weatherClock,
		isSyncing,
	]);

	useSettingStatus("weatherClock", isDirty ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-weatherClock"
			variant="ghost"
			size="icon"
			disabled={!isDirty}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[isDirty]
	);

	// Load from settings
	useEffect(() => {
		setIsSyncing(true);
		const weatherClock = settings.main?.weatherClock;
		if (weatherClock) {
			setCity(weatherClock.city);
			setBackgroundImage(weatherClock.backgroundImage || "");
			setBackgroundImageCity(weatherClock.backgroundImageCity || "");
		}
		setIsSyncing(false);
	}, [settings.main?.weatherClock]);

	const handleSave = useCallback(async () => {
		try {
			if (!city.trim()) {
				toast.error("도시명을 입력해주세요.");
				return;
			}

			const weatherClockSettings = {
				enabled: true,
				city: city.trim(),
				backgroundImage,
				backgroundImageCity,
			};

			await setSettingsMainWeatherClock(weatherClockSettings);
			await refreshSettings?.({ broadcast: true });
			updateMain?.({ weatherClock: weatherClockSettings });
			toast.success("저장되었습니다.");
		} catch (error) {
			console.error("Failed to save weather clock settings:", error);
			toast.error("저장에 실패했습니다.");
		}
	}, [city, backgroundImage, backgroundImageCity, refreshSettings, updateMain]);

	const handleReset = useCallback(async () => {
		try {
			const resetData = {
				enabled: true,
				city: "Seoul",
				backgroundImage: "",
				backgroundImageCity: "",
			};

			await setSettingsMainWeatherClock(resetData);
			await refreshSettings?.({ broadcast: true });
			updateMain?.({ weatherClock: resetData });

			// Reset state
			setCity(resetData.city);
			setBackgroundImage("");
			setBackgroundImageCity("");

			toast.success("날씨&시계 설정이 초기화되었습니다.");
			setShowResetDialog(false);
		} catch {
			toast.error("초기화에 실패했습니다.");
		}
	}, [refreshSettings, updateMain]);

	const handleGenerateImage = useCallback(async () => {
		if (!city.trim()) {
			toast.error("도시명을 먼저 입력해주세요.");
			return;
		}

		try {
			setIsGenerating(true);

			// 1. Gemini API로 이미지 생성
			const result = await generateCityIllustration({
				city: city.trim(),
				prompt: prompt.trim() || defaultPrompt,
			});

			if (!result.success || !result.imageUrl) {
				if (result.code === "MISSING_API_KEY") {
					throw new Error("계정 관리에서 Gemini API Key를 먼저 등록해주세요.");
				}
				throw new Error(result.error || "이미지 생성에 실패했습니다.");
			}

			// 2. 상태 업데이트 (서버 저장된 URL 사용)
			setBackgroundImage(result.imageUrl);
			setBackgroundImageCity(city.trim());

			toast.success("배경 일러스트가 생성되었습니다!");
		} catch (error) {
			console.error("Failed to generate city illustration:", error);
			toast.error(
				error instanceof Error ? error.message : "이미지 생성에 실패했습니다."
			);
		} finally {
			setIsGenerating(false);
		}
	}, [city, defaultPrompt, prompt]);

	const handleRemoveImage = useCallback(() => {
		setBackgroundImage("");
		setBackgroundImageCity("");
	}, []);

	return (
		<>
			<form
				id="setting-form-weatherClock"
				onSubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				className="space-y-6"
			>
				<div className="space-y-2">
					<Label htmlFor="city">도시명</Label>
					<Input
						id="city"
						type="text"
						placeholder="예: Seoul, Busan, Tokyo"
						value={city}
						onChange={(e) => setCity(e.target.value)}
					/>
					<p className="text-sm text-sub-text">
						날씨 정보를 표시할 도시를 영문으로 입력해주세요. (예: Seoul, Busan,
						Tokyo, New York)
					</p>
				</div>

				{/* 배경 일러스트 생성 섹션 */}
				<div className="space-y-4 pt-6 border-t ">
					<div>
						<div className="space-y-2">
							<Label>배경 일러스트</Label>
							<p className="text-sm text-sub-text">
								좌측에서 일러스트를 생성하고, 우측에서 프롬프트를
								편집할 수 있습니다.
							</p>
						</div>

						<div className="grid gap-8 grid-cols-2 mt-6">
							<div className="space-y-2">
								<Label htmlFor="weather-illustration-prompt">
									일러스트 미리보기
								</Label>
								{/* 이미지 프리뷰 */}
								{backgroundImage ? (
									<div className="relative rounded-card overflow-hidden border border-card">
										<img
											src={backgroundImage}
											alt={`${backgroundImageCity} 일러스트`}
											className="w-full h-40 object-cover"
										/>
										<div className="absolute top-2 right-2">
											<Button
												type="button"
												size="icon"
												variant="ghost"
												onClick={handleRemoveImage}
												className="rounded-card bg-black/50 hover:bg-black/70 text-white h-8 w-8"
											>
												<Trash2 size={14} />
											</Button>
										</div>
										{backgroundImageCity &&
											backgroundImageCity !== city.trim() && (
												<div className="absolute bottom-0 left-0 right-0 bg-yellow-500/90 text-xs text-white px-2 py-1">
													현재 도시({city})와 다른 도시({backgroundImageCity})의
													이미지입니다.
												</div>
											)}
									</div>
								) : (
									<div className="rounded-card border border-dashed border-card bg-card-bg/60 h-40 flex items-center justify-center text-xs text-sub-text">
										생성된 이미지가 여기에 표시됩니다.
									</div>
								)}

								{/* 생성 버튼 */}
								<Button
									type="button"
									onClick={handleGenerateImage}
									disabled={isGenerating || !city.trim()}
									className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10 w-full"
									style={{ transition: "all 0.3s ease-in-out" }}
								>
									{isGenerating ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
											일러스트 생성 중...
										</>
									) : backgroundImage ? (
										<>
											<RefreshCw size={16} className="mr-2" />
											일러스트 재생성
										</>
									) : (
										<>
											<Sparkles size={16} className="mr-2" />
											AI 일러스트 생성
										</>
									)}
								</Button>
							</div>

							<div className="space-y-2">
								<Label htmlFor="weather-illustration-prompt">
									일러스트 프롬프트
								</Label>
								<textarea
									id="weather-illustration-prompt"
									value={prompt}
									onChange={(event) => setPrompt(event.target.value)}
									className="w-full min-h-[160px] rounded-card border border-card bg-card-bg px-3 py-2 text-sm text-main-text"
									placeholder={defaultPrompt}
									style={{ resize: "none" }}
								/>
								<p className="text-xs text-sub-text">
									프롬프트를 비워두면 기본 프롬프트가 적용됩니다.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-6">
					<Button
						type="button"
						onClick={() => setShowResetDialog(true)}
						className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
						style={{
							transition: "all 0.3s ease-in-out",
						}}
					>
						초기화하기
					</Button>
					{/* 저장 버튼은 헤더로 이동 */}
				</div>
			</form>

			{/* Reset Dialog */}
			<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
				<DialogContent className="max-w-sm rounded-card">
					<DialogHeader>
						<DialogTitle className="text-lg font-semibold text-main-text">
							날씨&시계 초기화
						</DialogTitle>
						<DialogDescription className="text-sm text-sub-text">
							정말 날씨&시계 설정을 초기화할까요? 모든 설정이 기본값으로
							돌아갑니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowResetDialog(false)}
							className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
							style={{
								transition: "all 0.3s ease-in-out",
							}}
						>
							취소
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleReset}
							className="rounded-card border-card bg-card-bg hover:border-red-400 hover:text-red-400 hover:bg-red-400/10"
							style={{
								transition: "all 0.3s ease-in-out",
							}}
						>
							초기화
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
