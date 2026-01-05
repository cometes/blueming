import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsEffect } from "@/queries/set/setSettingsEffect";
import type { EffectSettings } from "@/contexts/SettingsContext";

export const useSettingEffect = () => {
	const { general, updateGeneral } = useSettings();
	const designData = general?.design || {};
	const effectData = designData?.effect;

	const effectTypes = [
		"없음",
		"눈",
		"비",
		"별똥별",
		"밤하늘",
		"프리즘",
		"반딧불이",
		"수중",
		"빗물창문",
		"영화관"
	] as const;

	// 이펙트 설정 기본값
	const defaultEffectSetting: EffectSettings = {
		enabled: false,
		type: "없음"
	};

	// Initialize state with either existing data or defaults
	const [effectSetting, setEffectSetting] = useState<EffectSettings>(() => ({
		...defaultEffectSetting,
		...(effectData || {})
	}));

	const [currentEffectType, setCurrentEffectType] = useState<EffectSettings["type"]>(
		effectData?.type || "없음"
	);

	// Load existing data when effectData changes
	useEffect(() => {
		if (effectData) {
			setEffectSetting({
				enabled: effectData.enabled ?? defaultEffectSetting.enabled,
				type: effectData.type || defaultEffectSetting.type
			});

			if (effectData.type) {
				setCurrentEffectType(effectData.type);
			}
		}
	}, [effectData]);

	// Update effect setting and immediately sync to global context
	const updateEffectSetting = useCallback((field: keyof EffectSettings, value: any) => {
		setEffectSetting(prev => {
			const newSetting = {
				...prev,
				[field]: value
			};

			// Immediately update global context for real-time preview in Layout
			if (general?.design) {
				updateGeneral({
					design: {
						...general.design,
						effect: newSetting
					}
				});
			}

			return newSetting;
		});
	}, [general, updateGeneral]);

	// Update effect type and immediately sync to global context
	useEffect(() => {
		if (currentEffectType !== effectSetting.type) {
			const newEffectSetting = {
				...effectSetting,
				type: currentEffectType
			};

			setEffectSetting(newEffectSetting);

			// Immediately update global context for real-time preview in Layout
			if (general?.design) {
				updateGeneral({
					design: {
						...general.design,
						effect: newEffectSetting
					}
				});
			}
		}
	}, [currentEffectType, effectSetting, general, updateGeneral]);

	// Reset all settings to default
	const handleReset = useCallback(async () => {
		try {
			setEffectSetting(defaultEffectSetting);
			setCurrentEffectType("없음");

			// Save reset settings to server
			const response = await setSettingsEffect(defaultEffectSetting);
			
			// Update context with new design settings
			if (general?.design) {
				updateGeneral({
					design: {
						...general.design,
						effect: defaultEffectSetting
					}
				});
			}

			// BroadcastChannel을 통해 리셋된 설정을 다른 탭/창에 알림
			const channel = new BroadcastChannel("effectSettingsUpdated");
			channel.postMessage({
				effectSettings: defaultEffectSetting,
				timestamp: Date.now()
			});
			channel.close();

			toast.success("이펙트 설정이 초기화되었습니다.");
		} catch (error) {
			console.error("이펙트 설정 초기화 실패:", error);
			toast.error("이펙트 설정을 초기화하지 못했습니다.");
		}
	}, [general, updateGeneral]);

	// Save settings
	const handleSave = useCallback(async () => {
		try {
			const response = await setSettingsEffect(effectSetting);
			
			// Update context with new design settings
			if (general?.design) {
				updateGeneral({
					design: {
						...general.design,
						effect: effectSetting
					}
				});
			}

			// BroadcastChannel을 통해 설정 변경사항을 다른 탭/창에 알림
			const channel = new BroadcastChannel("effectSettingsUpdated");
			channel.postMessage({
				effectSettings: effectSetting,
				timestamp: Date.now()
			});
			channel.close();

			toast.success("이펙트 설정이 성공적으로 저장되었습니다.");
		} catch (error) {
			console.error("이펙트 설정 저장 실패:", error);
			toast.error("이펙트 설정을 저장하지 못했습니다.");
		}
	}, [effectSetting, general, updateGeneral]);

	return {
		effectTypes,
		currentEffectType,
		setCurrentEffectType,
		effectSetting,
		setEffectSetting,
		updateEffectSetting,
		handleReset,
		handleSave
	};
};

