export interface WidgetSettings {
	background: string;
	borderColor: string;
	borderRadius: number;
	borderStyle: string;
	borderWidth: number;
	blur: number;
	borderImage: string;
	borderImageType?: "full" | "corner";
}

export interface CardSettings extends WidgetSettings {
	type: string;
	borderActiveColor: string;
	boxShadow: string;
	translateY: number;
}

export interface WidgetSettingProps {
	widget: WidgetSettings;
	card: CardSettings;
	updateDesignSetting: (path: string, value: string | number) => void;
	pendingBorderImage?: File | null;
	onBorderImageSelect?: (file: File) => void;
	onOpenBorderImagePicker?: () => void;
	isUploading?: boolean;
}
