"use client";

import { useEffect, useRef } from "react";

// 다른 효과들과 동일하게 자체 구현. (기존 react-tsparticles 의존 제거)
type Snowflake = {
	x: number;
	y: number;
	radius: number;
	speed: number;
	opacity: number;
	opacityDelta: number;
	wobblePhase: number;
	wobbleSpeed: number;
	color: string;
};

const COLORS = ["#ffffff", "#f0f8ff", "#e6f3ff"];
// 100만 픽셀당 눈송이 수 (화면 크기에 비례한 밀도)
const DENSITY_PER_MILLION_PX = 90;
const WOBBLE_DISTANCE = 5;

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const createFlake = (width: number, height: number, atTop = false): Snowflake => ({
	x: random(0, width),
	y: atTop ? -random(0, 20) : random(0, height),
	radius: random(1, 4),
	speed: random(0.5, 2),
	opacity: random(0.3, 0.8),
	opacityDelta: random(0.002, 0.006) * (Math.random() < 0.5 ? -1 : 1),
	wobblePhase: random(0, Math.PI * 2),
	wobbleSpeed: random(0.01, 0.03),
	color: COLORS[Math.floor(Math.random() * COLORS.length)],
});

const SnowEffect = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		let raf = 0;
		let width = 0;
		let height = 0;
		let flakes: Snowflake[] = [];

		const resize = () => {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			const target = Math.max(
				30,
				Math.round(((width * height) / 1_000_000) * DENSITY_PER_MILLION_PX)
			);
			if (flakes.length > target) {
				flakes = flakes.slice(0, target);
			} else {
				while (flakes.length < target) {
					flakes.push(createFlake(width, height));
				}
			}
		};

		const tick = () => {
			ctx.clearRect(0, 0, width, height);

			flakes.forEach((flake, index) => {
				flake.y += flake.speed;
				flake.wobblePhase += flake.wobbleSpeed;
				flake.opacity += flake.opacityDelta;
				if (flake.opacity < 0.3 || flake.opacity > 0.8) {
					flake.opacityDelta *= -1;
					flake.opacity = Math.min(0.8, Math.max(0.3, flake.opacity));
				}

				const drawX = flake.x + Math.sin(flake.wobblePhase) * WOBBLE_DISTANCE;
				ctx.globalAlpha = flake.opacity;
				ctx.fillStyle = flake.color;
				ctx.beginPath();
				ctx.arc(drawX, flake.y, flake.radius, 0, Math.PI * 2);
				ctx.fill();

				if (flake.y - flake.radius > height) {
					flakes[index] = createFlake(width, height, true);
				}
			});

			ctx.globalAlpha = 1;
			raf = requestAnimationFrame(tick);
		};

		resize();
		window.addEventListener("resize", resize);
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				zIndex: 0,
				pointerEvents: "none",
				overflow: "hidden",
			}}
		>
			<canvas ref={canvasRef} />
		</div>
	);
};

export default SnowEffect;
