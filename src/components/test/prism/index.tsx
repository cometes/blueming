import React from "react";

const PrismLightEffect = () => {
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
        animationDirection: i % 2 === 0 ? "alternate-reverse" : "alternate"
      };

      elements.push(<div key={i} style={style} />);
    }
    return elements;
  };

  const photos = [
    "https://images.unsplash.com/photo-1597992350431-56cb7e28a7a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NDI5NTQ0ODZ8&ixlib=rb-4.0.3&q=85",
    "https://images.unsplash.com/photo-1632230997264-b2bfc65cb8b4?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NDMwMjI3NzN8&ixlib=rb-4.0.3&q=85",
    "https://images.unsplash.com/photo-1473181488821-2d23949a045a?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NDMxMTM5Nzl8&ixlib=rb-4.0.3&q=85",
    "https://images.unsplash.com/photo-1516633886686-2a2ffb459273?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NDMxMjE2MzR8&ixlib=rb-4.0.3&q=85",
    "https://images.unsplash.com/photo-1596226310268-f76b50d14a4a?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NDMxMjg5MDF8&ixlib=rb-4.0.3&q=85",
    "https://images.unsplash.com/photo-1622350659525-5db262512ce2?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NDMxMjI0MjJ8&ixlib=rb-4.0.3&q=85"
  ];

  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap");

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        *::before,
        *::after {
          box-sizing: border-box;
        }

        html,
        body {
          overscroll-behavior-x: none;
          overscroll-behavior-y: none;
          scroll-behavior: smooth;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        }

        body {
          font-family: "Geist", sans-serif;
          font-size: clamp(20px, 5vw, 45px);
          position: relative;
          width: 100vw;
          height: 100vh;
          text-align: center;
          overflow: hidden;
          background-color: #555;
          color: PaleVioletRed;
        }

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
          position: absolute;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          mix-blend-mode: overlay;
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

        .photos-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .photo {
          position: absolute;
          width: 100%;
          height: 100%;
          inset: 0;
          opacity: 0;
          background-size: cover;
          background-position: center center;
          animation: photo-anim 30s infinite;
          animation-delay: var(--photo-delay);
          will-change: opacity;
        }

        .photo:nth-child(1) {
          --photo-delay: 0s;
          background-position: center bottom;
        }
        .photo:nth-child(2) {
          --photo-delay: 5s;
        }
        .photo:nth-child(3) {
          --photo-delay: 10s;
        }
        .photo:nth-child(4) {
          --photo-delay: 15s;
        }
        .photo:nth-child(5) {
          --photo-delay: 20s;
        }
        .photo:nth-child(6) {
          --photo-delay: 25s;
        }

        .photo::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(
            rgba(0, 0, 0, 0.4) 0%,
            transparent 30%,
            transparent 70%,
            rgba(0, 0, 0, 0.4) 100%
          );
          box-shadow: inset 0 0 6px 2px rgba(0, 0, 0, 0.3);
        }

        @keyframes photo-anim {
          0%,
          30%,
          100% {
            opacity: 0;
          }
          8%,
          22% {
            opacity: 1;
          }
        }

        .main-content {
          position: relative;
        }

        .section {
          position: relative;
          width: 100%;
          height: auto;
          min-height: 100vh;
          display: grid;
          place-items: center;
        }

        @property --hue {
          syntax: "<angle>";
          inherits: true;
          initial-value: 0deg;
        }

        .title,
        .subtitle {
          background-image: linear-gradient(
            60deg in oklch longer hue,
            oklch(0.9 0.1 360deg),
            oklch(0.9 0.1 0deg)
          );
          background-position: 200% 0%;
          background-repeat: repeat;
          background-size: 200% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          animation-name: text-anim;
          animation-duration: 8s;
          animation-timing-function: linear;
          animation-direction: reverse;
          animation-iteration-count: infinite;
          will-change: background;
        }

        .title {
          text-transform: uppercase;
          -webkit-text-stroke: 1px oklch(0.7 0.2 var(--hue) / 0.3);
          text-stroke: 1px oklch(0.7 0.2 var(--hue) / 0.3);
          animation-direction: normal;
          font-size: clamp(40px, 8vw, 80px);
          font-weight: 900;
          margin-bottom: 1rem;
        }

        .subtitle {
          font-size: clamp(20px, 4vw, 40px);
          font-weight: 300;
        }

        @keyframes text-anim {
          100% {
            background-position: -200% 0%;
          }
        }
      `}</style>

      <div className="w-full h-screen overflow-hidden relative bg-gray-600 text-pink-300 text-center font-sans">
        {/* Photo Slider Background */}
        <div className="photos-container">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="photo"
              style={{
                backgroundImage: `url(${photo})`
              }}
            />
          ))}
        </div>

        {/* Prism Light Effects */}
        <div className="prism-container">
          {generatePrismElements().map((element, index) => (
            <div
              key={index}
              className="prism-element"
              style={element.props.style}
            >
              {element}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <main className="main-content">
          <section className="section">
            <div>
              <h1 className="title">Prism</h1>
              <p className="subtitle">CSS Animation</p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default PrismLightEffect;
