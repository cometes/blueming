import { useState, useEffect } from "react";

const RealisticRainEffect = () => {
  const [showSplat, setShowSplat] = useState(true);
  const [showBackRow, setShowBackRow] = useState(true);
  const [singleDrop, setSingleDrop] = useState(false);
  const [rainDrops, setRainDrops] = useState([]);
  const [backRainDrops, setBackRainDrops] = useState([]);

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
        animationDuration: `0.5${randoHundo}s`
      };

      drops.push({
        id: `drop-${increment}-${randoHundo}`,
        style: dropStyle,
        stemStyle: {
          animationDelay: `0.${randoHundo}s`,
          animationDuration: `0.5${randoHundo}s`
        },
        splatStyle: {
          animationDelay: `0.${randoHundo}s`,
          animationDuration: `0.5${randoHundo}s`
        }
      });

      const backDropStyle = {
        right: `${increment}%`,
        bottom: `${randoFiver + randoFiver - 1 + 100}%`,
        animationDelay: `0.${randoHundo}s`,
        animationDuration: `0.5${randoHundo}s`
      };

      backDrops.push({
        id: `back-drop-${increment}-${randoHundo}`,
        style: backDropStyle,
        stemStyle: {
          animationDelay: `0.${randoHundo}s`,
          animationDuration: `0.5${randoHundo}s`
        },
        splatStyle: {
          animationDelay: `0.${randoHundo}s`,
          animationDuration: `0.5${randoHundo}s`
        }
      });
    }

    setRainDrops(drops);
    setBackRainDrops(backDrops);
  };

  useEffect(() => {
    generateRainDrops();
  }, [showSplat, showBackRow, singleDrop]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden"
      }}
    >
      {/* Front Row Rain */}
      <div className="rain-container front-row">
        {rainDrops.map((drop, index) => (
          <div
            key={drop.id}
            className={`raindrop ${
              singleDrop && index !== 9 ? "raindrop-hidden" : ""
            }`}
            style={drop.style}
          >
            <div className="stem" style={drop.stemStyle}></div>
            <div
              className={`splat ${showSplat ? "splat-show" : "splat-hidden"}`}
              style={drop.splatStyle}
            ></div>
          </div>
        ))}
      </div>

      {/* Back Row Rain */}
      {showBackRow && (
        <div className="rain-container back-row">
          {backRainDrops.map((drop, index) => (
            <div
              key={drop.id}
              className={`raindrop ${
                singleDrop && index !== 9 ? "raindrop-hidden" : ""
              }`}
              style={drop.style}
            >
              <div className="stem" style={drop.stemStyle}></div>
              <div
                className={`splat ${showSplat ? "splat-show" : "splat-hidden"}`}
                style={drop.splatStyle}
              ></div>
            </div>
          ))}
        </div>
      )}

      {/* Control Toggles */}
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 30 }}>
        <button
          onClick={() => setShowSplat(!showSplat)}
          className={`toggle splat-toggle ${showSplat ? "active" : ""}`}
          style={{ top: "20px" }}
        >
          SPLAT
        </button>
        <button
          onClick={() => setShowBackRow(!showBackRow)}
          className={`toggle back-row-toggle ${showBackRow ? "active" : ""}`}
          style={{ top: "90px" }}
        >
          BACK
          <br />
          ROW
        </button>
        <button
          onClick={() => setSingleDrop(!singleDrop)}
          className={`toggle single-toggle ${singleDrop ? "active" : ""}`}
          style={{ top: "160px" }}
        >
          SINGLE
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%"
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "white",
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            padding: "32px",
            borderRadius: "8px"
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2rem, 8vw, 4rem)",
              fontWeight: "bold",
              marginBottom: "16px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
            }}
          >
            🌧️ Realistic Rain
          </h1>
          <p style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)", opacity: 0.9 }}>
            CSS 스타일 비 효과
          </p>
        </div>
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

        .raindrop-hidden {
          display: none;
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

        .splat-hidden {
          display: none;
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

        .toggle {
          position: absolute;
          left: 20px;
          width: 50px;
          height: 50px;
          line-height: 51px;
          box-sizing: border-box;
          text-align: center;
          font-family: sans-serif;
          font-size: 10px;
          font-weight: bold;
          background-color: rgba(255, 255, 255, 0.2);
          color: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.3s;
          border: none;
        }

        .toggle:hover {
          background-color: rgba(255, 255, 255, 0.25);
        }

        .toggle:active {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .toggle.active {
          background-color: rgba(255, 255, 255, 0.4);
        }

        .back-row-toggle {
          line-height: 12px;
          padding-top: 14px;
        }
      `}</style>
    </div>
  );
};

export default RealisticRainEffect;
