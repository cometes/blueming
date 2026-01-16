"use client";

import { useSettings } from "@/contexts/SettingsContext";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import effects with SSR disabled
const SnowEffect = dynamic(() => import("./SnowEffect"), { ssr: false });
const RainEffect = dynamic(() => import("./RainEffect"), { ssr: false });
const MeteorEffect = dynamic(() => import("./MeteorEffect"), { ssr: false });
const StarryEffect = dynamic(() => import("./StarryEffect"), { ssr: false });
const PrismEffect = dynamic(() => import("./PrismEffect"), { ssr: false });
const FireflyEffect = dynamic(() => import("./FireflyEffect"), { ssr: false });
const BubbleEffect = dynamic(() => import("./BubbleEffect"), { ssr: false });
const RainWindowEffect = dynamic(() => import("./RainWindowEffect"), { ssr: false });
const CinemaEffect = dynamic(() => import("./CinemaEffect"), { ssr: false });

export default function BackgroundEffect() {
	const { general } = useSettings();
	const effectSettings = general?.design?.effect;
	const [shouldRender, setShouldRender] = useState(true);
	const [currentType, setCurrentType] = useState(effectSettings?.type);

	// Handle effect type changes with delay for cleanup
	useEffect(() => {
		if (effectSettings?.type !== currentType) {
			// Unmount current effect
			setShouldRender(false);

			// Wait for cleanup, then mount new effect
			const timer = setTimeout(() => {
				setCurrentType(effectSettings?.type);
				setShouldRender(true);
			}, 100); // 100ms delay for WebGL cleanup

			return () => clearTimeout(timer);
		}
	}, [effectSettings?.type, currentType]);

	const isEnabled = !!effectSettings?.enabled;
	const isNone = effectSettings?.type === "없음";
	const isRainWindowActive =
		isEnabled && !isNone && currentType === "빗물창문" && shouldRender;

	// Use effect type as key to force remount when switching effects
	const effectKey = `effect-${currentType}`;

	const renderEffect = () => {
		if (!isEnabled || isNone || !shouldRender) {
			return null;
		}

		switch (currentType) {
			case "눈":
				return <SnowEffect key={effectKey} />;
			case "비":
				return <RainEffect key={effectKey} />;
			case "별똥별":
				return <MeteorEffect key={effectKey} />;
			case "밤하늘":
				return <StarryEffect key={effectKey} />;
			case "프리즘":
				return <PrismEffect key={effectKey} />;
			case "반딧불이":
				return <FireflyEffect key={effectKey} />;
			case "비눗방울":
				return <BubbleEffect key={effectKey} />;
			case "영화관":
				return <CinemaEffect key={effectKey} />;
			case "빗물창문":
			default:
				return null;
		}
	};

	return (
		<div
			className="background-effect-layer fixed inset-0 z-0"
			aria-hidden="true"
		>
			{renderEffect()}
			<RainWindowEffect active={isRainWindowActive} />
		</div>
	);
}
