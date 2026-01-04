"use client";

import React, { useEffect } from "react";

const CinemaEffect = () => {
	useEffect(() => {
		// 폰트 로드
		const link = document.createElement("link");
		link.href = "https://fonts.googleapis.com/css?family=Roboto:100";
		link.rel = "stylesheet";
		document.head.appendChild(link);

		// 스타일 추가
		const style = document.createElement("style");
		style.textContent = `
      .cinema-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        z-index: 0;
        pointer-events: none;
      }
      
      .background {
        width: 100%;
        height: 100%;
        background-size: cover;
      }
      
      .outer-scratch, .inner-scratch {
        height: inherit;
      }
      
      .outer-scratch::after, .inner-scratch::after {
        content: '';
        width: 120%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        padding-left: 100px;
        opacity: 0.08;
        background: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/662025/scratch.png') repeat center center;
        animation: scratch 1.5s steps(1) infinite;
      }
      
      .inner-scratch::after {
        left: 30%;
        animation: inner-scratch 4s infinite;
      }
      
      .grain::after {
        content: '';
        width: 110%;
        height: 110%;
        position: absolute;
        top: -5%;
        left: -5%;
        opacity: 0.08;
        background: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/662025/grain.jpg') repeat center center;
        animation: grain 1.2s steps(1) infinite;
      }
      
      @keyframes grain {
        0%, 100% { transform: translate(0, 0, 0); }
        10% { transform: translate(-1%, -1%); }
        20% { transform: translate(1%, 1%); }
        30% { transform: translate(-2%, -2%); }
        40% { transform: translate(3%, 3%); }
        50% { transform: translate(-3%, -3%); }
        60% { transform: translate(4%, 4%); }
        70% { transform: translate(-4%, -4%); }
        80% { transform: translate(2%, 2%); }
        90% { transform: translate(-3%, -3%); }
      }
      
      @keyframes scratch {
        0%, 100% { transform: translateX(0); opacity: 0.075; }
        10% { transform: translateX(-1%); }
        20% { transform: translateX(1%); }
        30% { transform: translateX(-2%); opacity: 0.09; }
        40% { transform: translateX(3%); }
        50% { transform: translateX(-3%); opacity: 0.05; }
        60% { transform: translateX(8%); }
        70% { transform: translateX(-3%); }
        80% { transform: translateX(10%); opacity: 0.02; }
        90% { transform: translateX(-2%); }
      }
      
      @keyframes inner-scratch {
        0% { transform: translateX(0); opacity: 0.08; }
        10% { transform: translateX(-1%); }
        20% { transform: translateX(1%); }
        30% { transform: translateX(-2%); }
        40% { transform: translateX(3%); }
        50% { transform: translateX(-3%); opacity: 0.06; }
        60% { transform: translateX(8%); }
        70% { transform: translateX(-3%); }
        80% { transform: translateX(10%); opacity: 0.03; }
        90% { transform: translateX(20%); }
        100% { transform: translateX(30%); }
      }
    `;

		document.head.appendChild(style);

		return () => {
			document.head.removeChild(link);
			document.head.removeChild(style);
		};
	}, []);

	return (
		<div className="cinema-container">
			<div className="outer-scratch">
				<div className="inner-scratch">
					<div className="background grain"></div>
				</div>
			</div>
		</div>
	);
};

export default CinemaEffect;

