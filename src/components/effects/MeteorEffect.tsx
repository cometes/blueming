"use client";

import React from "react";
import type { CSSProperties } from "react";

type ShootingStarStyle = CSSProperties & Record<string, string | number>;

const MeteorEffect = () => {
	// 5개의 별똥별 생성
	const shootingStars = Array.from({ length: 5 }, (_, index) => {
		// 각 별똥별마다 랜덤한 값 생성
		const delay = Math.random() * 9999;
		const topPosition = Math.random() * 100;
		// 꼬리 길이를 30vw에서 80vw 사이의 랜덤 값으로 설정
		const tailLength = Math.random() * 50 + 30;
		// 이동 거리를 80vw에서 150vw 사이의 랜덤 값으로 설정
		const travelDistance = Math.random() * 50 + 80;

		return {
			id: index,
			delay: `${delay}ms`,
			top: `${topPosition}%`,
			tailWidth: `${tailLength}vw`,
			shootingTransform: `translateX(${travelDistance}vw)`, // 이동 거리 값
		};
	});

	const styles = {
		container: {
			position: "fixed" as const,
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			zIndex: 0,
			pointerEvents: "none" as const,
			overflow: "hidden",
			transform: "rotate(-215deg)",
		},
		shootingStar: {
			position: "absolute" as const,
			left: 0,
			height: "2px",
			background:
				"linear-gradient(-45deg, rgba(151, 151, 151, 0.35), rgba(0, 0, 255, 0))",
			borderRadius: "999px",
			filter: "drop-shadow(0 0 6px rgba(105, 155, 255, 1))",
			animation: "tail 4s linear infinite, shooting 4s linear infinite",
		},
	};

	return (
		<div style={styles.container}>
			<style>{`
				@keyframes tail {
					0% {
						width: 0;
						opacity: 0;
					}
					25% {
						opacity: 1;
					}
					75% {
						opacity: 1;
					}
					100% {
						width: var(--tail-width);
						opacity: 0;
					}
				}

				@keyframes shooting {
					0% {
						transform: translateX(0);
					}
					100% {
						/* 하드코딩된 값 대신 CSS 변수를 사용 */
						transform: var(--shooting-transform);
					}
				}
			`}</style>

			{shootingStars.map((star) => (
				<div
					key={star.id}
					style={
						{
							...styles.shootingStar,
							top: star.top,
							animationDelay: star.delay,
							"--tail-width": star.tailWidth,
							"--shooting-transform": star.shootingTransform,
						} as ShootingStarStyle
					}
				/>
			))}
		</div>
	);
};

export default MeteorEffect;
