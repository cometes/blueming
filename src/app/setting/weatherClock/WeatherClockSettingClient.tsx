"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
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

export default function WeatherClockSettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;

	const [city, setCity] = useState("Seoul");
	const [isSyncing, setIsSyncing] = useState(true);
	const [showResetDialog, setShowResetDialog] = useState(false);

	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const baseline = settings.main?.weatherClock || {
			city: "Seoul",
		};
		return city !== baseline.city;
	}, [city, settings.main?.weatherClock, isSyncing]);

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
			};

			await setSettingsMainWeatherClock(weatherClockSettings);
			await refreshSettings?.({ broadcast: true });
			updateMain?.({ weatherClock: weatherClockSettings });
			toast.success("저장되었습니다.");
		} catch (error) {
			console.error("Failed to save weather clock settings:", error);
			toast.error("저장에 실패했습니다.");
		}
	}, [city, refreshSettings, updateMain]);

	const handleReset = useCallback(async () => {
		try {
			const resetData = {
				enabled: true,
				city: "Seoul",
			};

			await setSettingsMainWeatherClock(resetData);
			await refreshSettings?.({ broadcast: true });
			updateMain?.({ weatherClock: resetData });

			// Reset state
			setCity(resetData.city);

			toast.success("날씨&시계 설정이 초기화되었습니다.");
			setShowResetDialog(false);
		} catch {
			toast.error("초기화에 실패했습니다.");
		}
	}, [refreshSettings, updateMain]);

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
