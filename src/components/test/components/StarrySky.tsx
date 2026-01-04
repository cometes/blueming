"use client";

import { useEffect } from "react";

export default function StarrySky() {
  useEffect(() => {
    const style = ["style1", "style2", "style3", "style4"];
    const tam = ["tam1", "tam1", "tam1", "tam2", "tam3"];
    const opacity = [
      "opacity1",
      "opacity1",
      "opacity1",
      "opacity2",
      "opacity2",
      "opacity3"
    ];

    const getRandomArbitrary = (min, max) => {
      return Math.floor(Math.random() * (max - min)) + min;
    };

    const estrelaCount = 250;
    const noite = document.querySelector(".constelacao");
    const widthWindow = window.innerWidth;
    const heightWindow = window.innerHeight;

    let estrela = "";
    for (let i = 0; i < estrelaCount; i++) {
      estrela += `<span class='estrela ${style[getRandomArbitrary(0, 4)]} ${
        opacity[getRandomArbitrary(0, 6)]
      } ${tam[getRandomArbitrary(0, 5)]}' 
        style='animation-delay: .${getRandomArbitrary(
          0,
          9
        )}s; left: ${getRandomArbitrary(0, widthWindow)}px; 
        top: ${getRandomArbitrary(0, heightWindow)}px;'></span>`;
    }
    if (noite) noite.innerHTML = estrela;

    const carregarMeteoro = () => {
      const randomDelay = getRandomArbitrary(5000, 10000);
      setTimeout(() => {
        const meteoro = `<div class='meteoro ${
          style[getRandomArbitrary(0, 4)]
        }'></div>`;
        const meteoroDiv = document.querySelector(".chuvaMeteoro");
        if (meteoroDiv) {
          meteoroDiv.innerHTML = meteoro;
          setTimeout(() => {
            meteoroDiv.innerHTML = "";
          }, 1000);
        }
        carregarMeteoro(); // recursively call again
      }, randomDelay);
    };

    carregarMeteoro();
  }, []);

  return (
    <>
      <style>{`
        * { box-sizing: content-box; }
        html, body, #root { margin: 0; height: 100%; width: 100%; overflow: hidden; position: relative; }
        .title {
          position: absolute;
          width: 100%;
          text-align: center;
          top: 50%;
          color: #fff;
          font-weight: 100;
          font-size: 3em;
          font-family: 'Pacifico', cursive;
        }
        .noite {
     
          width: 100%;
          height: 100%;
          position: absolute;
          overflow: hidden;
        }
        .constelacao {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          animation: rotate 600s infinite linear;
        }
        .estrela {
          background-color: white;
          border-radius: 50%;
          position: absolute;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .estrela.style1 { animation-duration: 0.5s; animation-name: estrela; }
        .estrela.style2 { animation-duration: 1s; animation-name: estrela; }
        .estrela.style3 { animation-duration: 1.5s; animation-name: estrela; }
        .estrela.style4 { animation-duration: 2s; animation-name: estrelaDestacada; }
        .estrela.tam1 { width: 1px; height: 1px; }
        .estrela.tam2 { width: 2px; height: 2px; }
        .estrela.tam3 { width: 3px; height: 3px; }
        .estrela.opacity1 { opacity: 1; }
        .estrela.opacity2 { opacity: 0.5; }
        .estrela.opacity3 { opacity: 0.1; }
        .meteoro {
          position: absolute;
          background-color: #fff;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          transform: rotate(-35deg);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-duration: 1s;
        }
        .meteoro:before {
          content: "";
          display: inline-block;
          vertical-align: middle;
          margin-right: 10px;
          width: 0;
          height: 0;
          border-top: 1px solid transparent;
          border-bottom: 1px solid transparent;
          border-left: 85px solid white;
          position: absolute;
          left: 2px;
          top: 0;
        }
        .meteoro.style1 { animation-name: meteoroStyle1; }
        .meteoro.style2 { animation-name: meteoroStyle2; }
        .meteoro.style3 { animation-name: meteoroStyle3; }
        .meteoro.style4 { animation-name: meteoroStyle4; }
        .lua {
          position: absolute;
          right: 200px;
          top: 150px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          box-shadow: 0 0 160px 0px #fff, 0 0 30px -4px #fff, 0 0 8px 2px rgba(255, 255, 255, 0.26);
          background-color: #fff;
          animation: lua 10s linear infinite;
        }
        .lua .textura {
          background-image: url(https://raw.githubusercontent.com/interaminense/starry-sky/master/src/img/bgMoon.png);
          background-position: center;
          background-size: 100%;
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          border-radius: 50%;
          opacity: 0.4;
        }
        .floresta {
          position: fixed;
          left: 0;
          bottom: 0;
          width: 100%;
        }
        .floresta img {
          width: 100%;
          position: absolute;
          bottom: 0;
          left: 0;
        }
        @keyframes estrela {
          0% { box-shadow: 0 0 10px 0px rgba(255, 255, 255, 0.05); }
          50% { box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.4); }
          100% { box-shadow: 0 0 10px 0px rgba(255, 255, 255, 0.05); }
        }
        @keyframes estrelaDestacada {
          0% { background-color: #FFF; box-shadow: 0 0 10px 0 rgba(255,255,255,1); }
          20% { background-color: #FFC4C4; box-shadow: 0 0 10px 0 rgba(255,196,196,1); }
          80% { background-color: #C4CFFF; box-shadow: 0 0 10px 0 rgba(196,207,255,1); }
          100% { background-color: #FFF; box-shadow: 0 0 10px 0 rgba(255,255,255,0.2); }
        }
        @keyframes meteoroStyle1 {
          0% { opacity: 0; right: 300px; top: 100px; }
          30% { opacity: .3; }
          60% { opacity: .3; }
          100% { opacity: 0; right: 1000px; top: 600px; }
        }
        @keyframes meteoroStyle2 {
          0% { opacity: 0; right: 700px; top: 100px; }
          30% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; right: 1400px; top: 600px; }
        }
        @keyframes meteoroStyle3 {
          0% { opacity: 0; right: 300px; top: 300px; }
          30% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; right: 1000px; top: 800px; }
        }
        @keyframes meteoroStyle4 {
          0% { opacity: 0; right: 700px; top: 300px; }
          30% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; right: 1400px; top: 800px; }
        }
        @keyframes lua {
          0%, 100% { box-shadow: 0 0 160px 0px #fff, 0 0 30px -4px #fff, 0 0 8px 2px rgba(255, 255, 255, 0.26); }
          50% { box-shadow: 0 0 80px 0px #fff, 0 0 30px -4px #fff, 0 0 8px 2px rgba(255, 255, 255, 0.26); }
        }
        // @keyframes rotate {
        //   0% { transform: rotate(0deg); }
        //   100% { transform: rotate(360deg); }
        // }
      `}</style>

      <div className="noite" />
      <div className="constelacao" />
      {/* <div className="lua">
        <div className="textura" />
      </div> */}
      <div className="chuvaMeteoro" />
      {/* <div className="floresta">
        <img
          src="https://raw.githubusercontent.com/interaminense/starry-sky/master/src/img/bgTree.png"
          alt="Floresta"
        />
      </div> */}
    </>
  );
}
