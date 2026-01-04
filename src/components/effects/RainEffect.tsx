"use client";

import { useState, useEffect } from "react";

const RainEffect = () => {
	const [rainDrops, setRainDrops] = useState<any[]>([]);
	const [backRainDrops, setBackRainDrops] = useState<any[]>([]);

	const generateRainDrops = () => {
		const drops = [];
		const backDrops = [];
		let increment = 0;

		while (increment < 100) {
			const randoHundo = Math.floor(Math.random() * (98 - 1 + 1) + 1);
			const randoFiver = Math.floor(Math.random() * (5 - 2 + 1) + 2);
			increment += randoFiver;

			const dropStyle = {
				left: `${increment}%`,
				bottom: `${randoFiver + randoFiver - 1 + 100}%`,
				animationDelay: `0.${randoHundo}s`,
				animationDuration: `0.5${randoHundo}s`,
			};

			drops.push({
				id: `drop-${increment}-${randoHundo}`,
				style: dropStyle,
				stemStyle: {
					animationDelay: `0.${randoHundo}s`,
					animationDuration: `0.5${randoHundo}s`,
				},
				splatStyle: {
					animationDelay: `0.${randoHundo}s`,
					animationDuration: `0.5${randoHundo}s`,
				},
			});

			const backDropStyle = {
				right: `${increment}%`,
				bottom: `${randoFiver + randoFiver - 1 + 100}%`,
				animationDelay: `0.${randoHundo}s`,
				animationDuration: `0.5${randoHundo}s`,
			};

			backDrops.push({
				id: `back-drop-${increment}-${randoHundo}`,
				style: backDropStyle,
				stemStyle: {
					animationDelay: `0.${randoHundo}s`,
					animationDuration: `0.5${randoHundo}s`,
				},
				splatStyle: {
					animationDelay: `0.${randoHundo}s`,
					animationDuration: `0.5${randoHundo}s`,
				},
			});
		}

		setRainDrops(drops);
		setBackRainDrops(backDrops);
	};

	useEffect(() => {
		generateRainDrops();
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
			{/* Front Row Rain */}
			<div className="rain-container front-row">
				{rainDrops.map((drop) => (
					<div key={drop.id} className="raindrop" style={drop.style}>
						<div className="stem" style={drop.stemStyle}></div>
						<div className="splat splat-show" style={drop.splatStyle}></div>
					</div>
				))}
			</div>

			{/* Back Row Rain */}
			<div className="rain-container back-row">
				{backRainDrops.map((drop) => (
					<div key={drop.id} className="raindrop" style={drop.style}>
						<div className="stem" style={drop.stemStyle}></div>
						<div className="splat splat-show" style={drop.splatStyle}></div>
					</div>
				))}
			</div>

			<style jsx>{`
				.rain-container {
					position: absolute;
					left: 0;
					width: 100vw;
					height: 100%;
					z-index: 2;
					pointer-events: none;
					overflow: hidden;
				}

				.rain-container.back-row {
					z-index: 1;
					bottom: 60px;
					opacity: 0.5;
				}

				.raindrop {
					position: absolute;
					bottom: 100%;
					width: 15px;
					height: 120px;
					pointer-events: none;
					animation: drop 0.5s linear infinite;
					max-width: 100%;
				}

				@keyframes drop {
					0% {
						transform: translateY(0vh);
					}
					75% {
						transform: translateY(100vh);
					}
					100% {
						transform: translateY(100vh);
					}
				}

				.stem {
					width: 1px;
					height: 60%;
					margin-left: 7px;
					background: linear-gradient(
						to bottom,
						rgba(255, 255, 255, 0),
						rgba(255, 255, 255, 0.25)
					);
					animation: stem 0.5s linear infinite;
				}

				@keyframes stem {
					0% {
						opacity: 1;
					}
					65% {
						opacity: 1;
					}
					75% {
						opacity: 0;
					}
					100% {
						opacity: 0;
					}
				}

				.splat {
					width: 15px;
					height: 10px;
					border-top: 2px dotted rgba(255, 255, 255, 0.5);
					border-radius: 50%;
					opacity: 1;
					transform: scale(0);
					animation: splat 0.5s linear infinite;
				}

				.splat-show {
					display: block;
				}

				@keyframes splat {
					0% {
						opacity: 1;
						transform: scale(0);
					}
					80% {
						opacity: 1;
						transform: scale(0);
					}
					90% {
						opacity: 0.5;
						transform: scale(1);
					}
					100% {
						opacity: 0;
						transform: scale(1.5);
					}
				}
			`}</style>
		</div>
	);
};

export default RainEffect;

