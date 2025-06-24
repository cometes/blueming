import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

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
		<>
			<style jsx>{`
				.dday-item::before {
					background-image: var(--before-bg);
				}
			`}</style>
			<div className="widget-wrapper">
				<div
					className="w-full h-full grid gap-3 "
					style={{ gridTemplateRows: "repeat(auto-fit, minmax(80px, 1fr))" }}
				>
					{ddayData.map((dday: DdayItem) => (
						<div
							className={cn(
								"dday-item relative px-4 py-5 flex flex-col justify-between w-full h-full overflow-hidden",
								"before:absolute before:top-0 before:left-0 before:content-[''] before:w-full before:h-full before:z-10 before:bg-no-repeat before:bg-cover before:bg-center",
								"after:absolute after:top-0 after:left-0 after:content-[''] after:w-full after:h-full after:bg-[rgba(127,127,127,0.4)] after:mix-blend-multiply after:opacity-50 after:z-20"
							)}
							key={dday.id}
							style={
								{
									"--before-bg": `url(${dday.image})`,
								} as React.CSSProperties & { "--before-bg": string }
							}
						>
							<p className="relative z-30 text-lg text-gray-100 [text-shadow:0_3px_8px_rgba(90,90,90,0.4)]">
								{dday.title}
							</p>
							<div className="relative z-30 flex flex-col items-end">
								<p className="relative z-30 text-2xl text-white [text-shadow:0_3px_8px_rgba(90,90,90,0.4)]">
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
		</>
	);
}
