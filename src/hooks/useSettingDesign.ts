import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import { setSettingsGeneralDesign } from "@/queries/set/setSettingsGeneralDesign";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

const defaultValues = {
	background: {
		type: "기본",
		color: "rgb(255, 255, 255)",
		image: "",
	},
	widget: {
		background: "rgba(255, 255, 255, 0.8)",
		borderColor: "rgb(222, 226, 230)",
		borderStyle: "solid",
		borderRadius: 6,
		borderWidth: 1,
		blur: 6,
		borderImage: "",
		borderImageType: "full" as const,
	},
	card: {
		type: "라이트",
		background: "rgba(250, 250, 250, 0.8)",
		borderColor: "rgb(222, 226, 230)",
		borderActiveColor: "rgb(173,181,189)",
		borderStyle: "solid",
		borderRadius: 6,
		borderWidth: 1,
		blur: 6,
		boxShadow: "rgba(0, 0, 0, 0.1) 0px 20px 20px -10px",
		translateY: -5,
	},
	font: {
		titleFontFamily: "Pretendard",
		bodyFontFamily: "Pretendard",
		mainFontColor: "rgb(33, 37, 41)",
		subFontColor: "rgb(110, 117, 127)",
	},
};

const mergeWithDefaults = (defaults, current) => {
	const result = { ...defaults };
	if (!current) return result;

	Object.keys(defaults).forEach((key) => {
		if (
			typeof defaults[key] === "object" &&
			defaults[key] !== null &&
			!Array.isArray(defaults[key]) &&
			typeof current[key] === "object" &&
			current[key] !== null
		) {
			result[key] = mergeWithDefaults(defaults[key], current[key]);
		} else if (current[key] !== undefined && current[key] !== null) {
			result[key] = current[key];
		}
	});

	return result;
};

export const useSettingDesign = () => {
  const { general, updateDesign, refreshSettings } = useSettings();
  const design = useMemo(() => general?.design || {}, [general?.design]); // Ensure design is not undefined
  const fontRegistry = useMemo(
    () => general?.fontRegistry || [],
    [general?.fontRegistry]
  );

  const [bgThumbnail, setBgThumnail] = useState("");
  const [openReset, setOpenReset] = useState(false);

  const BGTypes = ["단색", "그라데이션", "이미지"];
  const presetTypes = ["라이트", "다크", "커스텀"];
  const radiusTypes = [0, 6, 8, 10];
  const lineTypes = [
    { label: "기본", value: "solid" },
    { label: "두줄", value: "double" },
    { label: "도트", value: "dotted" },
    { label: "대쉬", value: "dashed" }
  ];
  const lightPreset = {
    borderStyle: "solid",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgb(222, 226, 230)",
    borderActiveColor: "rgb(173,181,189)",
    background: "rgba(250, 250, 250, 0.7)",
    blur: 10,
    boxShadow: "rgba(0, 0, 0, 0.1) 0px 20px 20px -10px",
    translateY: -5
  };
  const darkPreset = {
    borderStyle: "solid",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgb(52, 58, 64)",
    borderActiveColor: "rgb(96,107,118)",
    background: "rgba(33, 37, 41, 0.7)",
    blur: 10,
    boxShadow: "rgba(0, 0, 0, 0.1) 0px 20px 20px -10px",
    translateY: -5
  };
  const baseFontOptions = [
    { label: "프리텐다드", value: "Pretendard" },
    { label: "조선일보명조", value: "Chosunilbo" }
  ];
  const registryFonts = fontRegistry
    .filter((font) => font?.family)
    .map((font) => ({
      label: font.name || font.family,
      value: font.family,
    }));
  const buildFontOptions = (defaults) => {
    const merged = [...defaults, ...registryFonts];
    const seen = new Set();
    return merged.filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  };
  const fontOptions = buildFontOptions(baseFontOptions);
  const fontTitle = fontOptions;
  const fontBody = fontOptions;

  // Initialize with merged defaults and design immediately
  // This is the key change from the original code - we're merging on initialization
  const [currentDesignSetting, setCurrentDesignSetting] = useState(() =>
    mergeWithDefaults(defaultValues, design)
  );
  const baselineDesign = useMemo(
    () => mergeWithDefaults(defaultValues, design),
    [design]
  );
  const isDirty = useMemo(
    () => !_.isEqual(currentDesignSetting, baselineDesign),
    [currentDesignSetting, baselineDesign]
  );

  // Still update when design changes, but it should already be properly initialized
  useEffect(() => {
    if (design) {
      const mergedDesign = mergeWithDefaults(defaultValues, design);
      setCurrentDesignSetting(mergedDesign);
    }
  }, [design]);


  // Helper function to update a specific field in currentDesignSetting
  const updateDesignSetting = (path, value) => {
    setCurrentDesignSetting(prev => {
      // Create a deep clone of the previous state
      const updated = _.cloneDeep(prev);

      // Split the path into parts (e.g., "background.color" -> ["background", "color"])
      const parts = path.split(".");

      // Navigate to the correct nested object
      let current = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }

      // Update the value
      current[parts[parts.length - 1]] = value;

      return updated;
    });
  };

  // Get changed values compared to defaultValues
  const getChangedValues = (source = currentDesignSetting) => {
    const changedValues = {};

    Object.keys(source).forEach(key => {
      if (!_.isEqual(source[key], defaultValues[key])) {
        changedValues[key] = source[key];
      }
    });

    return changedValues;
  };

  const onClickSubmit = async (overrideDesign?: typeof currentDesignSetting) => {
    const source = overrideDesign ?? currentDesignSetting;
    const changedData = getChangedValues(source);
    try {
      const response = await setSettingsGeneralDesign(changedData);
      if (updateDesign) {
        updateDesign(response.general.design);
      }
      if (overrideDesign) {
        setCurrentDesignSetting(overrideDesign);
      }
      await refreshSettings?.({ broadcast: true });

      // BroadcastChannel을 통해 디자인 설정 변경사항을 다른 탭/창에 알림
      const channel = new BroadcastChannel("designSettingsUpdated");
      channel.postMessage({
        designSettings: response.general.design,
        timestamp: Date.now()
      });
      channel.close();

      toast.success("저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다.");
    }
  };

  const onClickReset = async () => {
    try {
      const response = await setSettingsGeneralDesign(defaultValues);
      setCurrentDesignSetting(defaultValues);
      if (updateDesign) {
        updateDesign(response.general.design);
      }
      await refreshSettings?.({ broadcast: true });

      // BroadcastChannel을 통해 디자인 설정 초기화를 다른 탭/창에 알림
      const channel = new BroadcastChannel("designSettingsUpdated");
      channel.postMessage({
        designSettings: response.general.design,
        timestamp: Date.now()
      });
      channel.close();

      toast.success("초기화되었습니다.");
      setOpenReset(false);
    } catch {
      toast.error("초기화에 실패했습니다.");
      setOpenReset(false);
    }
  };

  return {
    BGTypes,
    lineTypes,
    presetTypes,
    radiusTypes,
    lightPreset,
    darkPreset,
    fontTitle,
    fontBody,
    bgThumbnail,
    setBgThumnail,
    updateDesignSetting,
    currentDesignSetting,
    background: currentDesignSetting.background,
    card: currentDesignSetting.card,
    font: currentDesignSetting.font,
    widget: currentDesignSetting.widget,
    isDirty,
    onClickSubmit,
    openReset,
    setOpenReset,
    onClickReset,
    design
  };
};
