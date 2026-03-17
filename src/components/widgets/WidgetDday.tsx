import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";

interface DdayItem {
	id: string;
	title: string;
	date: string;
	image?: string;
}

export default function WidgetDday() {
	const { main } = useSettings();
	const ddayData = main.dday || [];

	const calculateDday = (targetDate: string): string => {
		if (!targetDate) return "D-?";

		try {
			const today = new Date();
			const target = new Date(targetDate);

			// 시간을 00:00:00으로 설정하여 정확한 날짜 계산
			today.setHours(0, 0, 0, 0);
			target.setHours(0, 0, 0, 0);

			const diffTime = target.getTime() - today.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays === 0) {
				return "D-Day";
			} else if (diffDays > 0) {
				return `D-${diffDays}`;
			} else {
				return `D+${Math.abs(diffDays)}`;
			}
		} catch {
			return "D-?";
		}
	};

	return (
		<div className="widget-wrapper">
			<div
				className="w-full h-full grid gap-3 "
				style={{ gridTemplateRows: "repeat(auto-fit, minmax(80px, 1fr))" }}
			>
				{ddayData.map((dday: DdayItem) => (
					<div
						className={cn(
							"dday-item relative p-3.5 flex flex-col justify-between w-full h-full overflow-hidden"
						)}
						key={dday.id}
					>
						{dday.image && (
							<Image
								alt={`${dday.title} 배경`}
								src={dday.image}
								fill
								className="absolute inset-0 object-cover object-center z-10"
								sizes="(max-width: 768px) 100vw, 33vw"
							/>
						)}
						<div className="absolute inset-0 bg-[rgba(127,127,127,0.4)] mix-blend-multiply opacity-50 z-20" />
						<p className="relative z-30 text-lg text-gray-100 [text-shadow:0_3px_8px_rgba(90,90,90,0.4)] font-title">
							{dday.title}
						</p>
						<div className="relative z-30 flex flex-col items-end">
							<p className="relative z-30 text-2xl text-white [text-shadow:0_3px_8px_rgba(90,90,90,0.4)] font-title">
								{calculateDday(dday.date)}
							</p>
							<p className="relative z-30 text-sm text-gray-400/60 [text-shadow:0_3px_8px_rgba(90,90,90,0.4)]">
								{dday.date}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
