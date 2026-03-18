import { useCallback, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SliderComponent from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";

export default function WidgetSlide() {
	const { main } = useSettings();
	const slides = main?.slide;

	const slickRef = useRef<SliderComponent>(null);

	const previous = useCallback(() => slickRef.current?.slickPrev(), []);
	const next = useCallback(() => slickRef.current?.slickNext(), []);

	const settings = {
		arrows: false,
		autoplay: true,
		infinite: true,
		speed: 500,
		autoplaySpeed: 5000,
		slidesToShow: 1,
		slidesToScroll: 1,
	};

	return (
		<div className="widget-wrapper">
			<div className="absolute top-0 left-0 w-full h-full">
				<button
					className="prev flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-5 z-40 shadow-[0_0_5px_0.5px_rgba(212,212,212,0.3)] w-14 h-14 rounded-full text-gray-100/30 cursor-pointer bg-transparent border-0 hover:text-gray-800 hover:bg-gray-50/60"
					style={{ transition: "all 200ms ease-in" }}
					onClick={previous}
				>
					<ChevronLeft />
				</button>
				<SliderComponent {...settings} ref={slickRef} className="custom-slider">
					{slides?.map((el, index) => (
						<a
							className="block h-full relative"
							key={index}
							href={el.url}
							target={el.target ? "blank" : ""}
						>
							<div className="w-full h-full relative">
								<Image
									className="absolute top-0 left-0 w-full h-full object-cover object-center"
									src={el.image}
									alt={`Slide ${index + 1}`}
									fill
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								/>
							</div>
						</a>
					))}
				</SliderComponent>
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
