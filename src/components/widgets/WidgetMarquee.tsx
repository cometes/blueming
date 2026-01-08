import Marquee from "react-fast-marquee";
import { useSettings } from "@/contexts/SettingsContext";

export default function WidgetMarquee() {
	const { main } = useSettings();
	const noticeData = main?.notice;

	return (
		<div className="relative w-full h-full overflow-hidden bg-clip-padding ">
			<div
				className="w-full h-full flex items-center"
				style={{
					background: `linear-gradient(90deg,
    rgba(255, 255, 255, 0) 0%,
    ${noticeData.marqueeSettings.backgroundColor} 30%,
    ${noticeData.marqueeSettings.backgroundColor} 70%,
    rgba(255, 255, 255, 0) 100%
  )`,
				}}
			>
				<Marquee
					gradient={noticeData.marqueeSettings.marqueeType === "컬러"}
					gradientColor={noticeData.marqueeSettings.gradientColor}
					gradientWidth={noticeData.marqueeSettings.gradientWidth}
					style={{ height: "100%" }}
				>
					<div
						className="min-h-6 flex items-center"
						style={{ color: noticeData.marqueeSettings.textColor }}
					>
						{noticeData.bannerText}
					</div>
				</Marquee>
			</div>
		</div>
	);
}
