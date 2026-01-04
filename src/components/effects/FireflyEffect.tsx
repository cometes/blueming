"use client";

import React, { useEffect, useState } from "react";

const FireflyEffect = () => {
	const quantity = 15;
	const [fireflies, setFireflies] = useState<any[]>([]);

	useEffect(() => {
		// Generate random values for each firefly
		const fireflyData = Array.from({ length: quantity }, (_, i) => {
			const steps = Math.floor(Math.random() * 12) + 16;
			const rotationSpeed = Math.floor(Math.random() * 10) + 8;
			const afterAnimationDuration = Math.floor(Math.random() * 6000) + 5000;
			const afterAnimationDelay = Math.floor(Math.random() * 8000) + 500;

			// Generate keyframe positions
			const keyframes = [];
			for (let step = 0; step <= steps; step++) {
				const percentage = step * (100 / steps);
				const translateX = Math.random() * 100 - 50;
				const translateY = Math.random() * 100 - 50;
				const scale = (Math.random() * 75) / 100 + 0.25;
				keyframes.push({
					percentage,
					translateX,
					translateY,
					scale,
				});
			}

			return {
				id: i + 1,
				rotationSpeed,
				afterAnimationDuration,
				afterAnimationDelay,
				keyframes,
			};
		});

		setFireflies(fireflyData);
	}, []);

	// Generate CSS for keyframes
	const generateKeyframes = (firefly: any) => {
		const keyframeString = firefly.keyframes
			.map(
				(kf: any) =>
					`${kf.percentage}% { transform: translateX(${kf.translateX}vw) translateY(${kf.translateY}vh) scale(${kf.scale}); }`
			)
			.join(" ");

		return `@keyframes move${firefly.id} { ${keyframeString} }`;
	};

	const styles = `
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    
    .firefly {
      position: fixed;
      left: 50%;
      top: 50%;
      width: 0.4vw;
      height: 0.4vw;
      margin: -0.2vw 0 0 9.8vw;
      animation: ease 200s alternate infinite;
      pointer-events: none;
      z-index: 0;
    }
    
    .firefly::before,
    .firefly::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transform-origin: -10vw;
    }
    
    .firefly::before {
      background: black;
      opacity: 0.4;
      animation: drift ease alternate infinite;
    }
    
    .firefly::after {
      background: white;
      opacity: 0;
      box-shadow: 0 0 0vw 0vw yellow;
      animation: drift ease alternate infinite, flash ease infinite;
    }
    
    @keyframes drift {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes flash {
      0%, 30%, 100% {
        opacity: 0;
        box-shadow: 0 0 0vw 0vw yellow;
      }
      5% {
        opacity: 1;
        box-shadow: 0 0 2vw 0.4vw yellow;
      }
    }
    
    ${fireflies
			.map(
				(firefly) => `
      .firefly:nth-child(${firefly.id}) {
        animation-name: move${firefly.id};
      }
      .firefly:nth-child(${firefly.id})::before {
        animation-duration: ${firefly.rotationSpeed}s;
      }
      .firefly:nth-child(${firefly.id})::after {
        animation-duration: ${firefly.rotationSpeed}s, ${
					firefly.afterAnimationDuration
				}ms;
        animation-delay: 0ms, ${firefly.afterAnimationDelay}ms;
      }
        .firefly:last-child {
        animation-name: move${firefly.id};
        animation-delay: 0ms, ${firefly.afterAnimationDelay}ms;
        }
      ${generateKeyframes(firefly)}
    `
			)
			.join("")}
  `;

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				zIndex: 0,
				pointerEvents: "none",
			}}
		>
			<style dangerouslySetInnerHTML={{ __html: styles }} />
			{Array.from({ length: quantity }, (_, i) => (
				<div key={i} className="firefly" />
			))}
		</div>
	);
};

export default FireflyEffect;
