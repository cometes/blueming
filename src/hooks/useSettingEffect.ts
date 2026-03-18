import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsEffect } from "@/features/settings/api/client";
import { runSettingsMutation } from "@/features/settings/hooks/mutation";
import type { EffectSettings } from "@/features/settings/types";

const defaultEffectSetting: EffectSettings = {
	enabled: false,
	type: "없음",
};

export const useSettingEffect = () => {
	const { general, updateGeneral, refreshSettings } = useSettings();
	const designData = general?.design;
	const effectData = designData?.effect;
	const isSyncingRef = useRef(false);
	const initialEffectRef = useRef<EffectSettings | null>(null);
	const isDirtyRef = useRef(false);
	const generalRef = useRef(general);
	const updateGeneralRef = useRef(updateGeneral);

	const effectTypes = [
		"없음",
		"눈",
		"비",
		"별똥별",
		"밤하늘",
		"프리즘",
		"반딧불이",
		"비눗방울",
		"빗물창문",
		"영화관"
	] as const;

	// Initialize state with either existing data or defaults
	const [effectSetting, setEffectSetting] = useState<EffectSettings>(() => ({
		...defaultEffectSetting,
		...(effectData || {})
	}));

	const [currentEffectType, setCurrentEffectType] = useState<EffectSettings["type"]>(
		(effectData?.type as EffectSettings["type"]) || "없음"
	);
	const baselineEffect = useMemo(
		() => ({
			enabled: effectData?.enabled ?? defaultEffectSetting.enabled,
			type:
				(effectData?.type as EffectSettings["type"]) || defaultEffectSetting.type,
		}),
		[effectData]
	);
	const baseline = initialEffectRef.current ?? baselineEffect;
	const isDirty = useMemo(
		() =>
			effectSetting.enabled !== baseline.enabled ||
			effectSetting.type !== baseline.type,
		[effectSetting, baseline.enabled, baseline.type]
	);

	// Load existing data when effectData changes
	useEffect(() => {
		generalRef.current = general;
		updateGeneralRef.current = updateGeneral;
	}, [general, updateGeneral]);

	useEffect(() => {
		if (effectData) {
			const nextEnabled = effectData.enabled ?? defaultEffectSetting.enabled;
			const nextType = (effectData.type ||
				defaultEffectSetting.type) as EffectSettings["type"];

			if (!initialEffectRef.current) {
				initialEffectRef.current = {
					enabled: nextEnabled,
					type: nextType,
				};
			}

			isSyncingRef.current = true;

			setEffectSetting((prev) =>
				prev.enabled === nextEnabled && prev.type === nextType
					? prev
					: {
							enabled: nextEnabled,
							type: nextType
					  }
			);

			setCurrentEffectType((prev) => (prev === nextType ? prev : nextType));
		}
	}, [effectData]);

	// Restore settings when leaving without saving
	useEffect(() => {
		return () => {
			const latestGeneral = generalRef.current;
			const restoreEffect = initialEffectRef.current;
			const restore = updateGeneralRef.current;

			if (!isDirtyRef.current || !restoreEffect || !latestGeneral?.design || !restore) {
				return;
			}

			restore({
				design: {
					...latestGeneral.design,
					effect: restoreEffect,
				},
			});
		};
	}, []);

	// Update effect setting state only
	const updateEffectSetting = useCallback(
		<K extends keyof EffectSettings>(field: K, value: EffectSettings[K]) => {
			setEffectSetting((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[]
	);

	// Keep effect type in sync with local state
	useEffect(() => {
		setEffectSetting((prev) =>
			prev.type === currentEffectType
				? prev
				: {
						...prev,
						type: currentEffectType,
				  }
		);
	}, [currentEffectType]);

	// Sync to global context for real-time preview (avoid updates during render)
	useEffect(() => {
		if (!general?.design) return;

		if (isSyncingRef.current) {
			isSyncingRef.current = false;
			return;
		}

		const current = general.design.effect;
		if (
			current?.enabled === effectSetting.enabled &&
			current?.type === effectSetting.type
		) {
			return;
		}

		isDirtyRef.current = true;

		updateGeneral?.({
			design: {
				...general.design,
				effect: effectSetting,
			},
		});
	}, [effectSetting, general, updateGeneral]);

	// Reset all settings to default
	const handleReset = useCallback(async () => {
		try {
			setEffectSetting(defaultEffectSetting);
			setCurrentEffectType("없음");
			isDirtyRef.current = false;

			// Save reset settings to server
			await runSettingsMutation({
				execute: () => setSettingsEffect(defaultEffectSetting),
				onSuccess: async () => {
					if (general?.design) {
						updateGeneral?.({
							design: {
								...general.design,
								effect: defaultEffectSetting
							}
						});
					}
				},
				refreshSettings,
				channelName: "effectSettingsUpdated",
				broadcastPayload: () => ({
					effectSettings: defaultEffectSetting,
				}),
			});
			
			toast.success("초기화되었습니다.");
			initialEffectRef.current = defaultEffectSetting;
		} catch {
			toast.error("초기화에 실패했습니다.");
		}
	}, [general, updateGeneral, refreshSettings]);

	// Save settings
	const handleSave = useCallback(async () => {
		try {
			await runSettingsMutation({
				execute: () => setSettingsEffect(effectSetting),
				onSuccess: async () => {
					if (general?.design) {
						updateGeneral?.({
							design: {
								...general.design,
								effect: effectSetting
							}
						});
					}
				},
				refreshSettings,
				channelName: "effectSettingsUpdated",
				broadcastPayload: () => ({
					effectSettings: effectSetting,
				}),
			});

			toast.success("저장되었습니다.");
			initialEffectRef.current = effectSetting;
			isDirtyRef.current = false;
		} catch {
			toast.error("저장에 실패했습니다.");
		}
	}, [effectSetting, general, updateGeneral, refreshSettings]);

	return {
		effectTypes,
		currentEffectType,
		setCurrentEffectType,
		effectSetting,
		setEffectSetting,
		updateEffectSetting,
		handleReset,
		handleSave,
		isDirty,
	};
};
