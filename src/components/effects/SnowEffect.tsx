"use client";

import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

const SnowEffect = () => {
	const particlesInit = useCallback(async (engine: Engine) => {
		await loadSlim(engine);
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
			<Particles
				id="snow-particles"
				init={particlesInit}
				options={{
					background: {
						color: {
							value: "transparent",
						},
					},
					fpsLimit: 60,
					interactivity: {
						events: {
							onClick: {
								enable: false,
							},
							onHover: {
								enable: false,
							},
							resize: true,
						},
					},
					particles: {
						color: {
							value: ["#ffffff", "#f0f8ff", "#e6f3ff"],
						},
						move: {
							direction: "bottom",
							enable: true,
							outModes: {
								default: "out",
							},
							random: false,
							speed: {
								min: 0.5,
								max: 2,
							},
							straight: false,
							gravity: {
								acceleration: 0.1,
								enable: true,
								inverse: false,
								maxSpeed: 2,
							},
						},
						number: {
							density: {
								enable: true,
								area: 1000,
							},
							value: 100,
						},
						opacity: {
							value: {
								min: 0.3,
								max: 0.8,
							},
							animation: {
								enable: true,
								speed: 0.5,
								sync: false,
							},
						},
						rotate: {
							value: {
								min: 0,
								max: 360,
							},
							direction: "random",
							animation: {
								enable: true,
								speed: 1,
							},
						},
						shape: {
							type: ["circle"],
							options: {
								polygon: {
									sides: 6,
								},
							},
						},
						size: {
							value: {
								min: 1,
								max: 4,
							},
							animation: {
								enable: true,
								speed: 2,
								sync: false,
							},
						},
						wobble: {
							distance: 5,
							enable: true,
							speed: {
								min: -2,
								max: 2,
							},
						},
						zIndex: {
							value: {
								min: 0,
								max: 100,
							},
						},
					},
					detectRetina: true,
				}}
			/>
		</div>
	);
};

export default SnowEffect;
