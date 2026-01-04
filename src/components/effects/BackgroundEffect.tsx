"use client";

import { useSettings } from "@/contexts/SettingsContext";
import dynamic from "next/dynamic";

// Dynamically import effects with SSR disabled
const SnowEffect = dynamic(() => import("./SnowEffect"), { ssr: false });
const RainEffect = dynamic(() => import("./RainEffect"), { ssr: false });
const MeteorEffect = dynamic(() => import("./MeteorEffect"), { ssr: false });
const StarryEffect = dynamic(() => import("./StarryEffect"), { ssr: false });
const PrismEffect = dynamic(() => import("./PrismEffect"), { ssr: false });
const FireflyEffect = dynamic(() => import("./FireflyEffect"), { ssr: false });
const UnderwaterEffect = dynamic(() => import("./UnderwaterEffect"), { ssr: false });
const RainWindowEffect = dynamic(() => import("./RainWindowEffect"), { ssr: false });
const CinemaEffect = dynamic(() => import("./CinemaEffect"), { ssr: false });

export default function BackgroundEffect() {
	const { general } = useSettings();
	const effectSettings = general?.design?.effect;

	// If effects are disabled or type is "없음", don't render anything
	if (!effectSettings?.enabled || effectSettings.type === "없음") {
		return null;
	}

	// Render the appropriate effect based on the selected type
	switch (effectSettings.type) {
		case "눈":
			return <SnowEffect />;
		case "비":
			return <RainEffect />;
		case "별똥별":
			return <MeteorEffect />;
		case "밤하늘":
			return <StarryEffect />;
		case "프리즘":
			return <PrismEffect />;
		case "반딧불이":
			return <FireflyEffect />;
		case "수중":
			return <UnderwaterEffect />;
		case "빗물창문":
			return <RainWindowEffect />;
		case "영화관":
			return <CinemaEffect />;
		default:
			return null;
	}
}

