import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";
import type { DdayItem } from "@/features/settings/types";

/** 페이드/슬라이드 모드에서 다음 디데이로 넘어가는 간격 */
const ROTATE_INTERVAL_MS = 5000;

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

const DdayCard = ({ dday }: { dday: DdayItem }) => (
	<div
		className={cn(
			"dday-item relative p-3.5 flex flex-col justify-between w-full h-full overflow-hidden"
		)}
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
);

export default function WidgetDday() {
	const { main } = useSettings();
	// "위젯에 추가"를 체크한 디데이만 표시
	const ddayData = (main?.dday || []).filter(
		(dday) => String(dday.target) === "true"
	);
	const displayMode = main?.ddayDisplayMode || "grid";
	const [activeIndex, setActiveIndex] = useState(0);

	// 페이드/슬라이드: 일정 간격으로 다음 디데이로 순환
	const rotating = displayMode !== "grid" && ddayData.length > 1;
	useEffect(() => {
		if (!rotating) return;
		const timer = setInterval(
			() => setActiveIndex((prev) => prev + 1),
			ROTATE_INTERVAL_MS
		);
		return () => clearInterval(timer);
	}, [rotating]);

	// 목록 길이가 바뀌면 범위 안으로 클램프
	const index = ddayData.length > 0 ? activeIndex % ddayData.length : 0;

	if (ddayData.length === 0) {
		return <div className="widget-wrapper" />;
	}

	if (displayMode === "fade" && ddayData.length > 1) {
		return (
			<div className="widget-wrapper">
				<div className="relative w-full h-full">
					{ddayData.map((dday, i) => (
						<div
							key={dday.uniqueId ?? dday.id}
							className={cn(
								"absolute inset-0 transition-opacity duration-700",
								i === index ? "opacity-100" : "opacity-0 pointer-events-none"
							)}
						>
							<DdayCard dday={dday} />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (displayMode === "slide" && ddayData.length > 1) {
		return (
			<div className="widget-wrapper">
				<div className="relative w-full h-full overflow-hidden">
					<div
						className="flex w-full h-full transition-transform duration-700 ease-in-out"
						style={{ transform: `translateX(-${index * 100}%)` }}
					>
						{ddayData.map((dday) => (
							<div
								key={dday.uniqueId ?? dday.id}
								className="w-full h-full shrink-0"
							>
								<DdayCard dday={dday} />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	// grid(기본): 선택된 디데이를 전부 동시에 표시
	return (
		<div className="widget-wrapper">
			<div
				className="w-full h-full grid gap-3 "
				style={{ gridTemplateRows: "repeat(auto-fit, minmax(80px, 1fr))" }}
			>
				{ddayData.map((dday) => (
					<DdayCard key={dday.uniqueId ?? dday.id} dday={dday} />
				))}
			</div>
		</div>
	);
}
