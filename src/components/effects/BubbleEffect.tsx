"use client";

import { useEffect, useRef } from "react";

type Bubble = {
	x: number;
	y: number;
	dy: number;
	radius: number;
};

const BubbleEffect = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const bubblesRef = useRef<Bubble[]>([]);
	const animationRef = useRef<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		const createBubble = (): Bubble => {
			const sizeBias = Math.random();
			const radius =
				sizeBias < 0.12 ? 24 + Math.random() * 14 : 6 + Math.random() ** 2 * 36;
			return {
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				dy: -1 - Math.random() * 2.5,
				radius: Math.round(radius),
			};
		};

		const initialize = () => {
			bubblesRef.current = Array.from({ length: 20 }, () => createBubble());
		};

		const drawBubble = (bubble: Bubble) => {
			ctx.beginPath();
			ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
			ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
			ctx.lineWidth = 1.5;
			ctx.stroke();
		};

		const updateBubble = (bubble: Bubble) => {
			const topLimit = canvas.height * 0.4;
			if (bubble.y + bubble.radius < topLimit) {
				bubble.y = canvas.height + bubble.radius;
				bubble.x = Math.random() * canvas.width;
			}
			bubble.y += bubble.dy;
		};

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for (const bubble of bubblesRef.current) {
				drawBubble(bubble);
				updateBubble(bubble);
			}
			animationRef.current = requestAnimationFrame(animate);
		};

		resize();
		initialize();
		animate();

		window.addEventListener("resize", resize);

		return () => {
			window.removeEventListener("resize", resize);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 z-0 pointer-events-none"
			aria-hidden="true"
		/>
	);
};

export default BubbleEffect;
