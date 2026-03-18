"use client";

import { useEffect, useRef, useState } from "react";

type RainWindowEffectProps = {
	active?: boolean;
};

type RaindropFxConfig = {
	canvas: HTMLCanvasElement;
	background?: string;
	backgroundBlurSteps?: number;
	mist?: boolean;
};

type RaindropFxInstance = {
	start?: () => Promise<void> | void;
	stop?: () => void;
	resize: (width: number, height: number) => void;
	destroy?: () => void;
	setBackground?: (url: string) => void;
};

type RaindropFxConstructor = new (config: RaindropFxConfig) => RaindropFxInstance;

function RainWindowEffectComponent({ active = true }: RainWindowEffectProps) {
	const [isMounted, setIsMounted] = useState(false);
	const [canvasKey] = useState(() => Date.now() + Math.random());
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const raindropFxRef = useRef<RaindropFxInstance | null>(null);
	const initPromiseRef = useRef<Promise<void> | null>(null);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted || !canvasRef.current) return;

		let cancelled = false;
		let handleResize: (() => void) | null = null;

		const resolveBackgroundUrl = () => {
			const bgImageValue = getComputedStyle(document.documentElement)
				.getPropertyValue("--bg-image")
				.trim();
			if (!bgImageValue || bgImageValue === "none") return undefined;
			const urlMatch = bgImageValue.match(/url\(["']?([^"')]+)["']?\)/);
			return urlMatch ? urlMatch[1] : bgImageValue;
		};

		const ensureInit = async () => {
			try {
				// 이전 클린업 완료 대기 (100ms로 증가)
				await new Promise((resolve) => setTimeout(resolve, 100));

				if (cancelled || !canvasRef.current) return;
				if (raindropFxRef.current) return;

				const canvas = canvasRef.current;
				const RaindropFX = (await import("raindrop-fx"))
					.default as RaindropFxConstructor;
				const rect = canvas.getBoundingClientRect();

				canvas.width = rect.width;
				canvas.height = rect.height;

				const backgroundUrl = resolveBackgroundUrl();

				const raindropConfig: RaindropFxConfig = {
					canvas: canvas,
					backgroundBlurSteps: 1,
					mist: false,
				};

				// 배경 이미지가 있으면 추가
				if (backgroundUrl) {
					raindropConfig.background = backgroundUrl;
				}

				raindropFxRef.current = new RaindropFX(raindropConfig);

				handleResize = () => {
					if (cancelled || !canvasRef.current || !raindropFxRef.current) return;
					const rect = canvasRef.current.getBoundingClientRect();
					raindropFxRef.current.resize(rect.width, rect.height);
				};

				window.addEventListener("resize", handleResize);
				if (active) {
					raindropFxRef.current.stop?.();
					await raindropFxRef.current.start?.();
				}
			} catch {
			}
		};

		if (active) {
			if (!initPromiseRef.current) {
				initPromiseRef.current = ensureInit();
			} else {
				initPromiseRef.current.then(() => {
					if (cancelled || !raindropFxRef.current) return;
					raindropFxRef.current.stop?.();
					raindropFxRef.current.start?.();
				});
			}
		} else if (raindropFxRef.current) {
			raindropFxRef.current.stop?.();
		}

		return () => {
			cancelled = true;

			// 리사이즈 이벤트 제거
			if (handleResize) {
				window.removeEventListener("resize", handleResize);
			}

			// 컴포넌트 언마운트 시에만 destroy
			if (raindropFxRef.current?.destroy) {
				try {
					raindropFxRef.current.stop?.();
					raindropFxRef.current.destroy();
					raindropFxRef.current = null;
					initPromiseRef.current = null;
				} catch {
				}
			}
		};
	}, [isMounted, active]);

	useEffect(() => {
		if (!active || !canvasRef.current || !raindropFxRef.current) return;
		const rect = canvasRef.current.getBoundingClientRect();
		raindropFxRef.current.resize(rect.width, rect.height);
	}, [active]);

	useEffect(() => {
		if (!active || !raindropFxRef.current) return;
		const backgroundUrl = (() => {
			const bgImageValue = getComputedStyle(document.documentElement)
				.getPropertyValue("--bg-image")
				.trim();
			if (!bgImageValue || bgImageValue === "none") return undefined;
			const urlMatch = bgImageValue.match(/url\(["']?([^"')]+)["']?\)/);
			return urlMatch ? urlMatch[1] : bgImageValue;
		})();
		if (backgroundUrl) {
			raindropFxRef.current.setBackground?.(backgroundUrl);
		}
	}, [active]);

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
			key={canvasKey}
			ref={canvasRef}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				zIndex: 0,
				pointerEvents: "none",
				opacity: active ? 1 : 0,
			}}
		/>
	);
}

// Next.js dynamic import로 SSR 방지
import dynamic from "next/dynamic";

const RainWindowEffect = dynamic<RainWindowEffectProps>(
	() => Promise.resolve(RainWindowEffectComponent),
	{
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
	}
);

export default RainWindowEffect;
