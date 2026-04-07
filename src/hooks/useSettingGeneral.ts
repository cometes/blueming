import { useForm } from "react-hook-form";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import type { General } from "@/features/settings/types";
import { setSettingsGeneralGeneral } from "@/features/settings/api/client";
import { runSettingsMutation } from "@/features/settings/hooks/mutation";
import { yupResolver } from "@hookform/resolvers/yup";
import { schemaSettingsGeneral } from "@/features/settings/lib/schema";

const baseFontOptions = [
	{ label: "프리텐다드", value: "Pretendard" },
	{ label: "조선일보명조", value: "Chosunilbo" },
];

const fontWeightOptions = [
	{ label: "얇게 (100)", value: "100" },
	{ label: "가늘게 (200)", value: "200" },
	{ label: "라이트 (300)", value: "300" },
	{ label: "보통 (400)", value: "400" },
	{ label: "미디움 (500)", value: "500" },
	{ label: "세미볼드 (600)", value: "600" },
	{ label: "굵게 (700)", value: "700" },
	{ label: "엑스트라볼드 (800)", value: "800" },
	{ label: "블랙 (900)", value: "900" },
];

const logoTypes = ["없음", "텍스트", "이미지"];

// 홈페이지 설정 기본값
const defaultGeneralSetting = {
	title: "",
	desc: "",
	favicon: "",
	shareImage: "",
	primaryColor: "#000000",
	secondaryColor: "#666666",
	logoType: "없음",
	logoImage: "",
	logoText: "",
	logoFontFamily: "",
	logoFontWeight: "700",
	logoColor: "",
};

export const useSettingGeneral = () => {
  const { general, updateGeneral, refreshSettings } = useSettings();
  const fontRegistry = useMemo(() => general?.fontRegistry || [], [general?.fontRegistry]);
  const fontTitle = useMemo(() => {
    const registryFonts = fontRegistry
      .filter((font): font is typeof font & { family: string } => Boolean(font?.family))
      .map((font) => ({ label: font.name || font.family, value: font.family }));
    const merged = [...baseFontOptions, ...registryFonts];
    const seen = new Set();
    return merged.filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  }, [fontRegistry]);
  const generalData = useMemo<Partial<General>>(
    () => general?.general || {},
    [general?.general]
  );
  const initialGeneral = useMemo(
    () => (generalData && Object.keys(generalData).length > 0 ? generalData : defaultGeneralSetting),
    [generalData]
  );

  // Initialize state only once with either existing data or defaults
  const [generalSetting, setGeneralSetting] = useState(() => ({
    ...defaultGeneralSetting,
    ...(generalData || {})
  }));

  const [currentLogo, setCurrentLogo] = useState(
    generalData?.logoType || "없음"
  );
  const [bgThumbnail, setBgThumnail] = useState("");
  const normalizedCurrent = useMemo(
    () => ({
      title: generalSetting.title || "",
      desc: generalSetting.desc || "",
      favicon: generalSetting.favicon || "",
      shareImage: generalSetting.shareImage || "",
      primaryColor: generalSetting.primaryColor || "",
      secondaryColor: generalSetting.secondaryColor || "",
      logoType: generalSetting.logoType || "없음",
      logoImage: generalSetting.logoImage || "",
      logoText: generalSetting.logoText || "",
      logoFontFamily: generalSetting.logoFontFamily || "",
      logoFontWeight: generalSetting.logoFontWeight || "700",
      logoColor: generalSetting.logoColor || "",
    }),
    [generalSetting]
  );
  const normalizedInitial = useMemo(
    () => ({
      title: initialGeneral.title || "",
      desc: initialGeneral.desc || "",
      favicon: initialGeneral.favicon || "",
      shareImage: initialGeneral.shareImage || "",
      primaryColor: initialGeneral.primaryColor || "",
      secondaryColor: initialGeneral.secondaryColor || "",
      logoType: initialGeneral.logoType || "없음",
      logoImage: initialGeneral.logoImage || "",
      logoText: initialGeneral.logoText || "",
      logoFontFamily: (initialGeneral as typeof defaultGeneralSetting).logoFontFamily || "",
      logoFontWeight: (initialGeneral as typeof defaultGeneralSetting).logoFontWeight || "700",
      logoColor: (initialGeneral as typeof defaultGeneralSetting).logoColor || "",
    }),
    [initialGeneral]
  );
  const isDirty = useMemo(
    () => JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitial),
    [normalizedCurrent, normalizedInitial]
  );

  // Form setup
  const {
    control,
    setValue,
    getValues,
    handleSubmit,
    formState,
    reset,
    watch
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(schemaSettingsGeneral),
    defaultValues: {
      title: generalData?.title || "",
      desc: generalData?.desc || ""
    }
  });

  // Watch form values
  const formValues = watch();

  // Load existing data only when generalData changes
  useEffect(() => {
    if (generalData && Object.keys(generalData).length > 0) {
      setGeneralSetting(prev => ({
        ...prev,
        title: generalData.title || prev.title,
        desc: generalData.desc || prev.desc,
        favicon: generalData.favicon || prev.favicon,
        shareImage: generalData.shareImage || prev.shareImage,
        primaryColor: generalData.primaryColor || prev.primaryColor,
        secondaryColor: generalData.secondaryColor || prev.secondaryColor,
        logoType: generalData.logoType || prev.logoType,
        logoImage: generalData.logoImage || prev.logoImage,
        logoFontFamily: generalData.logoFontFamily ?? prev.logoFontFamily,
        logoFontWeight: generalData.logoFontWeight ?? prev.logoFontWeight,
        logoColor: generalData.logoColor ?? prev.logoColor,
      }));

      // Set form values
      setValue("title", generalData.title || "");
      setValue("desc", generalData.desc || "");

      // Set logo type
      if (generalData.logoType) {
        setCurrentLogo(generalData.logoType);
      }
    }
  }, [generalData, setValue]);

  // 단일 setter - 모든 필드 업데이트에 사용
  const updateGeneralSetting = useCallback((field: string, value: unknown) => {
    setGeneralSetting(prev => ({ ...prev, [field]: value }));
  }, []);

  // 아래 세 함수는 updateGeneralSetting과 동일한 동작 - 인터페이스 호환성을 위해 유지
  const updateColorSetting = updateGeneralSetting;
  const handleImageUpload = updateGeneralSetting;
  const handleClearImage = useCallback(
    (field: string) => updateGeneralSetting(field, ""),
    [updateGeneralSetting],
  );

  // Update form when settings change - with proper dependency check
  useEffect(() => {
    const newTitle = formValues.title;
    if (newTitle !== undefined && newTitle !== generalSetting.title) {
      updateGeneralSetting("title", newTitle);
    }
  }, [formValues.title, generalSetting.title, updateGeneralSetting]);

  useEffect(() => {
    const newDesc = formValues.desc;
    if (newDesc !== undefined && newDesc !== generalSetting.desc) {
      updateGeneralSetting("desc", newDesc);
    }
  }, [formValues.desc, generalSetting.desc, updateGeneralSetting]);

  // Update logo type when it changes
  useEffect(() => {
    if (currentLogo !== generalSetting.logoType) {
      updateGeneralSetting("logoType", currentLogo);
    }
  }, [currentLogo, generalSetting.logoType, updateGeneralSetting]);

  // Reset all settings to default
  const handleReset = useCallback(async () => {
    try {
      setGeneralSetting(defaultGeneralSetting);
      setCurrentLogo("없음");
      setBgThumnail("");
      reset({
        title: "",
        desc: ""
      });

      // Save reset settings to server
      await runSettingsMutation({
        execute: () => setSettingsGeneralGeneral(defaultGeneralSetting),
        onSuccess: (response) => updateGeneral?.(response.general || {}),
        refreshSettings,
        channelName: "generalSettingsUpdated",
        broadcastPayload: (response) => ({
          generalSettings: response.general,
        }),
      });

      toast.success("초기화되었습니다.");
    } catch {
      toast.error("초기화에 실패했습니다.");
    }
  }, [reset, updateGeneral, refreshSettings]);

  // Save settings
  const handleSave = useCallback(async (nextSetting?: typeof generalSetting) => {
    try {
      const payload = nextSetting ?? generalSetting;
      await runSettingsMutation({
        execute: () => setSettingsGeneralGeneral(payload),
        onSuccess: (response) => updateGeneral?.(response.general || {}),
        refreshSettings,
        channelName: "generalSettingsUpdated",
        broadcastPayload: (response) => ({
          generalSettings: response.general,
        }),
      });
      
      toast.success("저장되었습니다.");
      return true;
    } catch {
      toast.error("저장에 실패했습니다.");
      return false;
    }
  }, [generalSetting, updateGeneral, refreshSettings]);

  return {
    handleSubmit,
    formState,
    getValues,
    setValue,
    control,
    logoTypes,
    currentLogo,
    setCurrentLogo,
    generalSetting,
    setGeneralSetting,
    updateGeneralSetting,
    updateColorSetting,
    handleImageUpload,
    handleClearImage,
    handleReset,
    handleSave,
    bgThumbnail,
    setBgThumnail,
    isDirty,
    fontTitle,
    fontWeightOptions,
  };
};
