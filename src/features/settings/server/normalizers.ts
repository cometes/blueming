import "server-only";

export const mapLogoTypeToKorean = (value?: string) => {
	if (!value) return value;
	if (value === "none") return "없음";
	if (value === "text") return "텍스트";
	if (value === "image") return "이미지";
	return value;
};

export const mapMenuDesignToKorean = (design: unknown) => {
	if (!design || typeof design !== "object") return design;
	const value = design as Record<string, unknown>;
	return {
		...value,
		align:
			value.align === "left"
				? "왼쪽"
				: value.align === "right"
					? "오른쪽"
					: value.align,
		type:
			value.type === "text"
				? "텍스트형"
				: value.type === "image"
					? "이미지"
					: value.type,
		textAlign:
			value.textAlign === "left"
				? "왼쪽"
				: value.textAlign === "center"
					? "가운데"
					: value.textAlign === "right"
						? "오른쪽"
						: value.textAlign,
		logoType:
			value.logoType === "none"
				? "없음"
				: value.logoType === "text"
					? "텍스트"
					: value.logoType === "image"
						? "이미지"
						: value.logoType,
		bgType:
			value.bgType === "none"
				? "없음"
				: value.bgType === "color"
					? "단색"
					: value.bgType === "image"
						? "이미지"
						: value.bgType,
		iconBarLogoType:
			value.iconBarLogoType === "none"
				? "없음"
				: value.iconBarLogoType === "image"
					? "이미지"
					: value.iconBarLogoType,
		iconBarBgType:
			value.iconBarBgType === "none"
				? "없음"
				: value.iconBarBgType === "color"
					? "단색"
					: value.iconBarBgType === "image"
						? "이미지"
						: value.iconBarBgType,
	};
};

export const mapEffectTypeToKorean = (value?: string) => {
	if (!value) return value;
	switch (value) {
		case "none":
			return "없음";
		case "snow":
			return "눈";
		case "rain":
			return "비";
		case "meteor":
			return "별똥별";
		case "night":
			return "밤하늘";
		case "prism":
			return "프리즘";
		case "firefly":
			return "반딧불이";
		case "bubbles":
			return "비눗방울";
		case "rainWindow":
			return "빗물창문";
		case "cinema":
			return "영화관";
		default:
			return value;
	}
};

export const normalizeGeneralData = (data: unknown) => {
	if (!data || typeof data !== "object") return data;
	const value = data as Record<string, unknown>;

	const nextGeneral = value.general
		? {
				...(value.general as Record<string, unknown>),
				logoType: mapLogoTypeToKorean(
					(value.general as Record<string, unknown>).logoType as string | undefined
				),
			}
		: value.general;

	const nextMenu = value.menu
		? {
				...(value.menu as Record<string, unknown>),
				design: mapMenuDesignToKorean(
					(value.menu as Record<string, unknown>).design
				),
			}
		: value.menu;

	const normalizedEffect = value.effect
		? {
				...(value.effect as Record<string, unknown>),
				type: mapEffectTypeToKorean(
					(value.effect as Record<string, unknown>).type as string | undefined
				),
			}
		: undefined;

	const nextDesign = value.design
		? {
				...(value.design as Record<string, unknown>),
				effect: (value.design as Record<string, unknown>).effect
					? {
							...((value.design as Record<string, unknown>)
								.effect as Record<string, unknown>),
							type: mapEffectTypeToKorean(
								(
									(value.design as Record<string, unknown>).effect as Record<
										string,
										unknown
									>
								).type as string | undefined
							),
						}
					: normalizedEffect,
			}
		: value.design ||
			(normalizedEffect ? { effect: normalizedEffect } : value.design);

	return {
		...value,
		general: nextGeneral,
		menu: nextMenu,
		design: nextDesign,
		effect: normalizedEffect,
	};
};

