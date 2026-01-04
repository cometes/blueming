"use client";

import React from "react";

const PrismEffect = () => {
	// Generate 30 prism elements with random properties
	const generatePrismElements = () => {
		const elements = [];
		for (let i = 1; i <= 30; i++) {
			const plusminus = i % 2 === 0 ? -1 : 1;
			const posX = Math.random() * 100;
			const posY = Math.random() * 100;
			const angle = (Math.random() * 5 + 5) * plusminus;

			const style = {
				"--pos-x-s": `${posX}vw`,
				"--pos-y-s": `${posY}vh`,
				"--angle-s": `${angle}deg`,
				"--pos-x-e": `${posX + Math.random() * 8 + 5}vw`,
				"--pos-y-e": `${posY + Math.random() * 8 + 5}vh`,
				"--angle-e": `${angle + (Math.random() * 20 + 2) * plusminus}deg`,
				"--scale": Math.random() * 2 + 1,
				"--duration": `${Math.random() * 10 + 5}s`,
				"--delay": `${Math.random() * 70 * -0.3}s`,
				"--opacity": Math.random() * 0.5 + 0.2,
				animationDirection: i % 2 === 0 ? "alternate-reverse" : "alternate",
			};

			elements.push(<div key={i} style={style as any} />);
		}
		return elements;
	};

	return (
		<>
			<style jsx global>{`
				@property --pos-x {
					syntax: "<length>";
					inherits: true;
					initial-value: 0px;
				}
				@property --pos-y {
					syntax: "<length>";
					inherits: true;
					initial-value: 0px;
				}
				@property --angle {
					syntax: "<angle>";
					inherits: true;
					initial-value: 0deg;
				}

				.prism-container {
					position: fixed;
					top: 0;
					left: 0;
					width: 100vw;
					height: 100vh;
					mix-blend-mode: overlay;
					z-index: 0;
					pointer-events: none;
					--size: 0.025;
					--opacity: 1;
					--pos-x-s: 0vw;
					--pos-y-s: 0vh;
					--angle-s: 0deg;
					--pos-x-e: 0vw;
					--pos-y-e: 0vh;
					--angle-e: 0deg;
					--scale: 1;
					--duration: 2s;
					--delay: 0s;
				}

				.prism-element {
					position: absolute;
					top: 0;
					left: 0;
					width: calc(((100vmin + 100vmax) / 2) * var(--size));
					height: calc(((100vmin + 100vmax) / 2) * var(--size));
					background-image: linear-gradient(
						to bottom in oklch decreasing hue,
						oklch(0.8 0.3 300deg / var(--opacity)) 24%,
						oklch(0.8 0.2 300deg / var(--opacity)),
						oklch(0.8 0.2 300deg / var(--opacity)),
						oklch(0.95 0.2 270deg / var(--opacity)),
						oklch(0.95 0.2 270deg / var(--opacity)),
						oklch(0.95 0.2 240deg / var(--opacity)),
						oklch(0.95 0.2 240deg / var(--opacity)),
						oklch(0.95 0.1 210deg / var(--opacity)),
						oklch(0.95 0.1 210deg / var(--opacity)),
						oklch(0.95 0.1 180deg / var(--opacity)),
						oklch(0.95 0.1 180deg / var(--opacity)),
						oklch(0.95 0.1 150deg / var(--opacity)),
						oklch(0.95 0.1 150deg / var(--opacity)),
						oklch(0.95 0.1 120deg / var(--opacity)),
						oklch(0.95 0.1 120deg / var(--opacity)),
						oklch(0.95 0.2 90deg / var(--opacity)),
						oklch(0.95 0.2 90deg / var(--opacity)),
						oklch(0.95 0.2 60deg / var(--opacity)),
						oklch(0.95 0.2 60deg / var(--opacity)),
						oklch(0.95 0.2 30deg / var(--opacity)),
						oklch(0.95 0.2 30deg / var(--opacity)),
						oklch(0.8 0.2 0deg / var(--opacity)),
						oklch(0.8 0.2 0deg / var(--opacity)),
						oklch(0.8 0.2 0deg / var(--opacity)) 78%
					);
					background-position: center;
					background-repeat: no-repeat;
					background-size: 100% 100%;
					mask-image: radial-gradient(
						closest-side circle at center,
						white 30%,
						transparent
					);
					transform: skew(calc(var(--angle) / 2), var(--angle))
						rotate(calc(var(--angle) * -2))
						translate3d(var(--pos-x), var(--pos-y), 0)
						scale3d(calc(var(--scale) / 1.8), var(--scale), 1);
					transform-origin: center top;
					will-change: transform;
					animation-name: prism-anim;
					animation-duration: var(--duration);
					animation-delay: var(--delay);
					animation-timing-function: ease-in-out;
					animation-direction: alternate;
					animation-iteration-count: infinite;
				}

				@keyframes prism-anim {
					0% {
						--pos-x: var(--pos-x-s);
						--pos-y: var(--pos-y-s);
						--angle: var(--angle-s);
					}
					100% {
						--pos-x: var(--pos-x-e);
						--pos-y: var(--pos-y-e);
						--angle: var(--angle-e);
					}
				}
			`}</style>

			<div className="prism-container">
				{generatePrismElements().map((element, index) => (
					<div key={index} className="prism-element" style={element.props.style}>
						{element}
					</div>
				))}
			</div>
		</>
	);
};

export default PrismEffect;

