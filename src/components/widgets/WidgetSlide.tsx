import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const SLIDE_INTERVAL_MS = 5000;
const SLIDE_TRANSITION_MS = 500;

// 기존 react-slick 대체: 양끝 클론을 두어 무한 루프를 구현한 소형 슬라이더
export default function WidgetSlide() {
	const { main } = useSettings();
	const slides = main?.slide ?? [];
	const count = slides.length;

	// position은 클론 포함 트랙 기준 (0 = 마지막 슬라이드 클론, count+1 = 첫 슬라이드 클론)
	const [position, setPosition] = useState(1);
	const [animated, setAnimated] = useState(true);
	const hoverRef = useRef(false);

	const next = useCallback(() => {
		setAnimated(true);
		setPosition((prev) => Math.min(prev + 1, count + 1));
	}, [count]);

	const previous = useCallback(() => {
		setAnimated(true);
		setPosition((prev) => Math.max(prev - 1, 0));
	}, []);

	useEffect(() => {
		if (count < 2) return;
		const timer = setInterval(() => {
			if (!hoverRef.current) next();
		}, SLIDE_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [count, next]);

	// 클론 위치에 도달하면 트랜지션 없이 실제 슬라이드 위치로 점프
	const handleTransitionEnd = () => {
		if (position === count + 1) {
			setAnimated(false);
			setPosition(1);
		} else if (position === 0) {
			setAnimated(false);
			setPosition(count);
		}
	};

	if (count === 0) {
		return <div className="widget-wrapper" />;
	}

	const trackSlides = [slides[count - 1], ...slides, slides[0]];

	return (
		<div className="widget-wrapper">
			<div
				className="absolute top-0 left-0 w-full h-full"
				onMouseEnter={() => {
					hoverRef.current = true;
				}}
				onMouseLeave={() => {
					hoverRef.current = false;
				}}
			>
				<button
					className="prev flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-5 z-40 shadow-[0_0_5px_0.5px_rgba(212,212,212,0.3)] w-14 h-14 rounded-full text-gray-100/30 cursor-pointer bg-transparent border-0 hover:text-gray-800 hover:bg-gray-50/60"
					style={{ transition: "all 200ms ease-in" }}
					onClick={previous}
				>
					<ChevronLeft />
				</button>
				<div className="w-full h-full overflow-hidden">
					<div
						className="flex h-full"
						style={{
							transform: `translateX(-${position * 100}%)`,
							transition: animated
								? `transform ${SLIDE_TRANSITION_MS}ms ease`
								: "none",
						}}
						onTransitionEnd={handleTransitionEnd}
					>
						{trackSlides.map((el, index) => (
							<div key={index} className="w-full h-full flex-none">
								<a
									className="block h-full relative"
									href={el.url}
									target={el.target ? "blank" : ""}
								>
									<div className="w-full h-full relative">
										<Image
											className="absolute top-0 left-0 w-full h-full object-cover object-center"
											src={el.image}
											alt={`Slide ${index}`}
											fill
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
										/>
									</div>
								</a>
							</div>
						))}
					</div>
				</div>
				<button
					className="next flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-5 z-40 shadow-[0_0_5px_0.5px_rgba(212,212,212,0.3)] w-14 h-14 rounded-full text-gray-100/30 cursor-pointer bg-transparent border-0 hover:text-gray-800 hover:bg-gray-50/60"
					style={{ transition: "all 200ms ease-in" }}
					onClick={next}
				>
					<ChevronRight />
				</button>
			</div>
		</div>
	);
}
