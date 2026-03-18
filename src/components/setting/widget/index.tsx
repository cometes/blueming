"use client";

import { Separator } from "@/components/ui/separator";
import { useSettingDesign } from "@/hooks/useSettingDesign";
import WidgetSection from "./WidgetSection";
import CardSection from "./CardSection";
import type { WidgetSettingProps } from "./types";

export default function WidgetSetting({
	widget,
	card,
	updateDesignSetting,
	onBorderImageSelect,
	onOpenBorderImagePicker,
	isUploading = false,
}: WidgetSettingProps) {
	const { lightPreset, darkPreset, presetTypes, radiusTypes, lineTypes } =
		useSettingDesign();

	return (
		<div className="space-y-8">
			<WidgetSection
				widget={widget}
				lineTypes={lineTypes}
				updateDesignSetting={updateDesignSetting}
				onBorderImageSelect={onBorderImageSelect}
				onOpenBorderImagePicker={onOpenBorderImagePicker}
				isUploading={isUploading}
			/>

			<Separator className="my-12" />

			<CardSection
				card={card}
				presetTypes={presetTypes}
				radiusTypes={radiusTypes}
				lineTypes={lineTypes}
				lightPreset={lightPreset}
				darkPreset={darkPreset}
				updateDesignSetting={updateDesignSetting}
			/>
		</div>
	);
}
