import { useSettings } from "@/contexts/SettingsContext";

export default function WidgetStickerBoard() {
	const { main } = useSettings();
	const stickerBoard = main?.stickerBoard;

	return (
		<>
			<div className="widget-wrapper">
				<div className="w-full h-full absolute">
					<img className="w-full h-full object-cover object-center" src={stickerBoard?.capture} />
				</div>
			</div>
		</>
	);
}
