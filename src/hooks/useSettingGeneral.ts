import { useForm } from "react-hook-form";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import type { General } from "@/contexts/SettingsContext";
import { setSettingsGeneralGeneral } from "@/queries/set/setSettingsGeneralGeneral";
import { yupResolver } from "@hookform/resolvers/yup";
import { schemaSettingsGeneral } from "@/lib/schema";

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
};

export const useSettingGeneral = () => {
  const { general, updateGeneral, refreshSettings } = useSettings();
  const generalData = useMemo<Partial<General>>(
    () => general?.general || {},
    [general?.general]
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
      logoText: generalSetting.logoText || ""
    }),
    [generalSetting]
  );
  const normalizedInitial = useMemo(
    () => ({
      title: generalData.title || "",
      desc: generalData.desc || "",
      favicon: generalData.favicon || "",
      shareImage: generalData.shareImage || "",
      primaryColor: generalData.primaryColor || "",
      secondaryColor: generalData.secondaryColor || "",
      logoType: generalData.logoType || "없음",
      logoImage: generalData.logoImage || "",
      logoText: generalData.logoText || ""
    }),
    [generalData]
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
        logoImage: generalData.logoImage || prev.logoImage
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

  // Memoize handlers to prevent unnecessary re-renders
  const updateGeneralSetting = useCallback((field, value) => {
    setGeneralSetting(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateColorSetting = useCallback((field, value) => {
    setGeneralSetting(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleImageUpload = useCallback((field, value) => {
    setGeneralSetting(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleClearImage = useCallback(field => {
    setGeneralSetting(prev => ({
      ...prev,
      [field]: ""
    }));
  }, []);

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
      const response = await setSettingsGeneralGeneral(defaultGeneralSetting);
      updateGeneral(response.general);
      await refreshSettings?.({ broadcast: true });

      // BroadcastChannel을 통해 리셋된 설정을 다른 탭/창에 알림
      const channel = new BroadcastChannel("generalSettingsUpdated");
      channel.postMessage({
        generalSettings: response.general,
        timestamp: Date.now()
      });
      channel.close();

      toast.success("초기화되었습니다.");
    } catch {
      toast.error("초기화에 실패했습니다.");
    }
  }, [reset, updateGeneral, refreshSettings]);

  // Save settings
  const handleSave = useCallback(async (nextSetting?: typeof generalSetting) => {
    try {
      const payload = nextSetting ?? generalSetting;
      const response = await setSettingsGeneralGeneral(payload);
      updateGeneral(response.general);
      await refreshSettings?.({ broadcast: true });
      
      // BroadcastChannel을 통해 설정 변경사항을 다른 탭/창에 알림
      const channel = new BroadcastChannel("generalSettingsUpdated");
      channel.postMessage({
        generalSettings: response.general,
        timestamp: Date.now()
      });
      channel.close();
      
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
  };
};
