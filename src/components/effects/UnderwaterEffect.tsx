"use client";

import React from "react";

const UnderwaterEffect = () => {
	return (
		<>
			<style jsx global>{`
				#underwater-bg {
					display: block;
					position: fixed;
					top: 0;
					left: 0;
					width: 100vw;
					height: 100vh;
					background-image: linear-gradient(
						to bottom,
						white,
						gray 25%,
						gray 60%,
						khaki
					);
					opacity: 0.5;
					mix-blend-mode: overlay;
					z-index: 0;
					pointer-events: none;
				}
				#underwater-surface {
					mix-blend-mode: overlay;
					position: fixed;
					top: 0;
					left: 0;
					width: 100vw;
					height: 100vh;
					z-index: 0;
					pointer-events: none;
				}
				#underwater-surface::before,
				#underwater-surface::after {
					content: "";
					display: block;
					position: absolute;
					bottom: 0;
					left: 0;
					width: 100vw;
					height: 100vh;
					background-image: url("https://images.unsplash.com/photo-1518837695005-2083093ee35b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MTEyMTIwOTZ8&ixlib=rb-4.0.3&q=80&w=400");
					background-repeat: repeat-x;
					--duration: 8s;
					--lowHeight: 30vh;
					--highHeight: 70vh;
					--layerNum: 2;
					--index: 0;
					--opacity: 0.4;
					animation: surface var(--duration) linear infinite;
					animation-delay: calc(
						(var(--duration) / var(--layerNum)) * var(--index) * -1
					);
					opacity: 0;
					mask-image: linear-gradient(
						to top,
						white,
						transparent var(--lowHeight)
					);
				}
				#underwater-surface::before {
					--index: 0;
					transform: scale3d(1, -1, 1);
				}
				#underwater-surface::after {
					--index: 1;
					transform: scale3d(-1, -1, 1);
				}
				#underwater-caustics {
					position: fixed;
					bottom: 0;
					top: 0;
					width: 100vw;
					height: 100vh;
					z-index: 0;
					pointer-events: none;
				}
				#underwater-caustics::before,
				#underwater-caustics::after {
					content: "";
					display: block;
					position: absolute;
					bottom: 0;
					left: 0;
					width: 100vw;
					height: 100vh;
					background-repeat: repeat;
					--duration: 10s;
					--gapY: 0px;
					background-size: calc(100vw / 1) 30vh;
					animation: caustics calc(var(--duration) * 1) linear infinite;
					opacity: 0.3;
					mask-image: linear-gradient(
						to top,
						white,
						transparent,
						transparent,
						transparent
					);
				}
				#underwater-caustics::after {
					--duration: 11s;
					--gapY: 10vh;
					animation-delay: -2s;
					transform: scale3d(-1, 1, 1);
				}
				#underwater-sun {
					mix-blend-mode: overlay;
					position: fixed;
					top: 0;
					left: 0;
					width: 100vw;
					height: 100vh;
					z-index: 0;
					pointer-events: none;
				}
				#underwater-sun div {
					content: "";
					display: block;
					position: absolute;
					bottom: 0;
					left: 0;
					width: 100%;
					height: 100%;
					transform-origin: 50vw 0;
					animation: sun 7s ease infinite alternate;
					mask-image: linear-gradient(
						to bottom,
						transparent 15%,
						white 50%,
						white 55%,
						transparent 80%
					);
				}
				#underwater-sun #sun_layer1 {
					background: linear-gradient(
						to right,
						transparent 39%,
						white 40%,
						transparent 41%,
						transparent 48.5%,
						white 50%,
						transparent 51.5%,
						transparent 53%,
						white 54%,
						transparent 55%,
						transparent 70%,
						white 71%,
						transparent 72%
					);
				}
				#underwater-sun #sun_layer2 {
					animation-delay: -2s;
					animation-duration: 7.8s;
					animation-direction: alternate-reverse;
					background: linear-gradient(
						to right,
						transparent 32%,
						white 33%,
						transparent 34%,
						transparent 38%,
						white 39%,
						transparent 40%,
						transparent 53%,
						white 54%,
						transparent 55%,
						transparent 63.5%,
						white 65%,
						transparent 66.5%
					);
				}
				#underwater-sun #sun_layer3 {
					animation-delay: -5s;
					animation-duration: 8.5s;
					background: linear-gradient(
						to right,
						transparent 38.5%,
						white 40%,
						transparent 41.5%,
						transparent 47%,
						white 48%,
						transparent 49%,
						transparent 52%,
						white 53%,
						transparent 54%,
						transparent 60%,
						white 61%,
						transparent 62%
					);
				}
				@keyframes surface {
					0% {
						opacity: 0;
						background-position: center bottom;
						background-size: 100% var(--highHeight);
					}
					20% {
						opacity: var(--opacity);
					}
					100% {
						opacity: 0;
						background-position: center bottom calc(-1 * var(--lowHeight));
						background-size: 100% var(--lowHeight);
					}
				}
				@keyframes caustics {
					0% {
						background-position: bottom var(--gapY) left;
					}
					100% {
						background-position: bottom var(--gapY) left -100vw;
					}
				}
				@keyframes sun {
					0% {
						opacity: 0.1;
						transform: skew(5deg) scale3d(3, 1.5, 1);
					}
					50% {
						opacity: 0.08;
						transform: skew(0deg) scale3d(1.5, 1, 1);
					}
					100% {
						opacity: 0.1;
						transform: skew(-5deg) scale3d(3, 1, 1);
					}
				}
			`}</style>

			<div id="underwater-bg" />
			<div id="underwater-surface" />
			<div id="underwater-caustics" />
			<div id="underwater-sun">
				<div id="sun_layer1"></div>
				<div id="sun_layer2"></div>
				<div id="sun_layer3"></div>
			</div>
		</>
	);
};

export default UnderwaterEffect;

