"use client";

import { useEffect, useRef, useState } from "react";

function RainWindowEffectComponent() {
	const [isMounted, setIsMounted] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted || !canvasRef.current) return;

		let cancelled = false;
		let raindropFx: any = null;
		let handleResize: (() => void) | null = null;

		const initRaindrop = async () => {
			try {
				if (cancelled || !canvasRef.current) return;

				const RaindropFX = (await import("raindrop-fx")).default;
				const canvas = canvasRef.current;
				const rect = canvas.getBoundingClientRect();

				canvas.width = rect.width;
				canvas.height = rect.height;

				raindropFx = new RaindropFX({
					canvas: canvas,
					background:
						"https://firebasestorage.googleapis.com/v0/b/gray-and-blue/o/library%2Fcreate%2Fimages%2F1744047070244_%5B%C3%A1%C2%84%C2%92%C3%A1%C2%85%C2%A7%C3%A1%C2%86%C2%AB%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%A5%C3%A1%C2%86%C2%AB%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%A2%C3%A1%C2%86%C2%BC%C3%A1%C2%84%C2%83%C3%A1%C2%85%C2%B5%C3%A1%C2%84%C2%8C%C3%A1%C2%85%C2%A1%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%AB-%C3%A1%C2%84%C2%87%C3%A1%C2%85%C2%A2%C3%A1%C2%84%C2%91%C3%A1%C2%85%C2%A9%5D_%C3%A1%C2%84%C2%86%C3%A1%C2%85%C2%A9%C3%A1%C2%84%C2%83%C3%A1%C2%85%C2%A5%C3%A1%C2%86%C2%AB%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%B5%C3%A1%C2%84%C2%90%C3%A1%C2%85%C2%B5-%C3%A1%C2%84%C2%87%C3%A1%C2%85%C2%A2%C3%A1%C2%84%C2%80%C3%A1%C2%85%C2%A7%C3%A1%C2%86%C2%BC%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%B5%C3%A1%C2%84%C2%86%C3%A1%C2%85%C2%B5%C3%A1%C2%84%C2%8C%C3%A1%C2%85%C2%B5.png?alt=media",
					backgroundBlurSteps: 1,
					mist: false,
				});

				handleResize = () => {
					if (cancelled || !canvasRef.current || !raindropFx) return;
					const rect = canvasRef.current.getBoundingClientRect();
					raindropFx.resize(rect.width, rect.height);
				};

				window.addEventListener("resize", handleResize);
				await raindropFx.start();
			} catch (error) {
				console.error("RaindropFX error:", error);
			}
		};

		initRaindrop();

		return () => {
			cancelled = true;
			if (handleResize) {
				window.removeEventListener("resize", handleResize);
			}
			if (raindropFx?.destroy) {
				raindropFx.destroy();
			}
		};
	}, [isMounted]);

	if (!isMounted) {
		return (
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100vw",
					height: "100vh",
					backgroundColor: "transparent",
					zIndex: 0,
					pointerEvents: "none",
				}}
			/>
		);
	}

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				zIndex: 0,
				pointerEvents: "none",
			}}
		/>
	);
}

// Next.js dynamic import로 SSR 방지
import dynamic from "next/dynamic";

const RainWindowEffect = dynamic(() => Promise.resolve(RainWindowEffectComponent), {
	ssr: false,
	loading: () => (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				backgroundColor: "transparent",
				zIndex: 0,
				pointerEvents: "none",
			}}
		/>
	),
});

export default RainWindowEffect;

