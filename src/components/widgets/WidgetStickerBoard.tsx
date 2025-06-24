import { useSettings } from "@/contexts/SettingsContext";
import Image from "next/image";

export default function WidgetStickerBoard() {
	const { main } = useSettings();
	const stickerBoard = main?.stickerBoard;

	return (
		<>
			<div className="widget-wrapper">
				<div className="w-full h-full absolute">
					{stickerBoard?.capture && (
						<Image 
							alt="스티커보드" 
							className="w-full h-full object-cover object-center" 
							src={stickerBoard.capture}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>
					)}
				</div>
			</div>
		</>
	);
}
