import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const SnowEffect = () => {
  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async container => {
    console.log(container);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
      <Particles
        id="snow-particles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: "transparent"
            }
          },
          fpsLimit: 60,
          interactivity: {
            events: {
              onClick: {
                enable: false
              },
              onHover: {
                enable: false
              },
              resize: true
            }
          },
          particles: {
            color: {
              value: ["#ffffff", "#f0f8ff", "#e6f3ff"]
            },
            move: {
              direction: "bottom",
              enable: true,
              outModes: {
                default: "out"
              },
              random: false,
              speed: {
                min: 0.5,
                max: 2
              },
              straight: false,
              gravity: {
                acceleration: 0.1,
                enable: true,
                inverse: false,
                maxSpeed: 2
              }
            },
            number: {
              density: {
                enable: true,
                area: 1000
              },
              value: 100
            },
            opacity: {
              value: {
                min: 0.3,
                max: 0.8
              },
              animation: {
                enable: true,
                speed: 0.5,
                sync: false
              }
            },
            rotate: {
              value: {
                min: 0,
                max: 360
              },
              direction: "random",
              animation: {
                enable: true,
                speed: 1
              }
            },
            shape: {
              type: ["circle"],
              options: {
                polygon: {
                  sides: 6
                }
              }
            },
            size: {
              value: {
                min: 1,
                max: 4
              },
              animation: {
                enable: true,
                speed: 2,
                sync: false
              }
            },
            wobble: {
              distance: 5,
              enable: true,
              speed: {
                min: -2,
                max: 2
              }
            },
            zIndex: {
              value: {
                min: 0,
                max: 100
              }
            }
          },
          detectRetina: true
        }}
      />

      {/* 콘텐츠 영역 */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-shadow">
            ❄️ 겨울 원더랜드
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            자연스러운 눈 효과를 즐겨보세요
          </p>
        </div>
      </div>

      {/* 추가 스타일링을 위한 CSS */}
      <style jsx>{`
        .text-shadow {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default SnowEffect;
