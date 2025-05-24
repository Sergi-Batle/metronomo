import { useEffect, useRef, forwardRef } from "react";
import anime from "animejs";
import "./SphereAnimation.css";
import SphereSVG from "./SphereSVG";

const SphereAnimation = forwardRef((props, ref) => {
  const sphereRef = useRef(null);
  const animationsRef = useRef([]);

  useEffect(() => {
    if (!sphereRef.current) return;

    const sphereEl = sphereRef.current.querySelector(".sphere-animation");
    const spherePathEls = sphereEl.querySelectorAll(".sphere path");
    const pathLength = spherePathEls.length;
    const animations = [];

    const breathAnimation = anime({
      begin: () => {
        for (let i = 0; i < pathLength; i++) {
          animations.push(
            anime({
              targets: spherePathEls[i],
              stroke: {
                value: ["rgba(255,75,75,1)", "rgba(80,80,80,.35)"],
                duration: props.pulseIntervalMs,
              },
              translateX: [2, -4],
              translateY: [2, -4],
              easing: "easeOutQuad",
              autoplay: false,
            })
          );
        }
        animationsRef.current = animations;
      },
      update: (ins) => {
        animations.forEach((animation, i) => {
          animation.duration = props.pulseIntervalMs;
          const percent =
            (1 -
              Math.sin(
                i * 0.35 +
                2 *
                Math.PI *
                ((ins.currentTime % props.pulseIntervalMs) /
                  props.pulseIntervalMs)
              )) /
            2;
          animation.seek(animation.duration * percent);
        });
      },
      duration: Number.POSITIVE_INFINITY,
      autoplay: false,
    });

    // function pingo() {
    //   console.log("pingo", props.playing)
    // }
    // setInterval(pingo, 5000);

    // Pausar o reanudar según props.playing
    const savedStateRef = { current: [] };

    if (props.playing) {
      breathAnimation.play();
    }

    return () => {
      spherePathEls.forEach((el, index) => {
        const strokeColor = window.getComputedStyle(el).stroke;
        console.log(`Elemento ${index}: stroke =`, strokeColor);
      });

      console.log("shutdown")

      breathAnimation.pause();

      const trackAnimation = (sphereEl) => {
        console.log("trackAnimation");
        const illuminatedPaths = [];
      
        spherePathEls.forEach((el, index) => {
          const strokeColor = window.getComputedStyle(el).stroke;
      
          const rgbaMatch = strokeColor.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);

          if (!rgbaMatch) return;
      
          const r = Number(rgbaMatch[1]);
          const g = Number(rgbaMatch[2]);
          const b = Number(rgbaMatch[3]);
          const alpha = rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1;
      
          function isOutsideRange(value, range) {
            return value < range[0] || value > range[1];
          }
          
          function isColorOutsideRange(r, g, b, range) {
            return [r, g, b].some(v => isOutsideRange(v, range));
          }
          
          // Luego en tu código:
          const range = [80, 200];
          
          if (isColorOutsideRange(r, g, b, range)) {
            // el.style.stroke = `rgba(255, 255, 0, ${alpha})`;
            console.log(alpha);
            console.log(`Elemento ${index} está iluminado`, strokeColor);
            illuminatedPaths.push(el);
          }
          
        });
      
        return illuminatedPaths;
      };
      
      
      var illuminatedPaths = trackAnimation(sphereEl);


      const runWaveAnimation = (illuminatedPaths) => {
        if (!illuminatedPaths.length) return;
      
        const sphereEl = illuminatedPaths[0].closest(".sphere-animation");
        const spherePathEls = Array.from(sphereEl.querySelectorAll(".sphere path"));
        const totalPaths = spherePathEls.length;
      
        const sourcePath = illuminatedPaths[illuminatedPaths.length - 1];
        const sourceIndex = spherePathEls.indexOf(sourcePath);
        if (sourceIndex === -1) return;
      
        const orderedPaths = [];
        for (let i = sourceIndex; i >= 0; i--) {
          orderedPaths.push(spherePathEls[i]);
        }
        const pathLength = orderedPaths.length;
      
        const totalDuration = props.pulseIntervalMs;
        const waveRatio = 0.340;
        const waveDuration = totalDuration * waveRatio;
        const maxOffset = totalDuration - waveDuration;
      
        // Lee el color y translateY actuales para cada path
        const initialStates = orderedPaths.map(path => {
          const style = window.getComputedStyle(path);
          const stroke = style.stroke;
          const translateY = parseFloat(path.style.transform?.match(/translateY\((-?\d+\.?\d*)px\)/)?.[1]) || 0;
          return { stroke, translateY };
        });
      
        return anime({
          duration: totalDuration,
          easing: "linear",
          update: (anim) => {
            const time = anim.currentTime;
      
            orderedPaths.forEach((path, i) => {
              const offset = (i / pathLength) * maxOffset;
              const localTime = time - offset;
      
              if (localTime >= 0 && localTime <= waveDuration) {
                const t = localTime / waveDuration;
                const wave = Math.sin(Math.PI * t);
      
                // Para no reiniciar la opacidad, sacamos la opacidad actual
                // e interpolamos entre la actual y la nueva
                const currentStroke = window.getComputedStyle(path).stroke;
                const rgbaMatch = currentStroke.match(/rgba?\((\d+), (\d+), (\d+), ([\d.]+)\)/);
                let currentAlpha = 0.35;
                if (rgbaMatch) {
                  currentAlpha = Number(rgbaMatch[4]);
                }
      
                // Calcula alpha objetivo en esta posición del wave
                const targetAlpha = 0.35 + 0.65 * wave;
      
                // Interpola alpha desde el actual al target para suavizar
                const alpha = currentAlpha + (targetAlpha - currentAlpha) * 0.1; // factor de suavizado 0.1
      
                const color = `rgba(255, 75, 75, ${alpha})`;
      
                // Para translateY también suaviza la transición
                const initialTranslateY = initialStates[i].translateY || 0;
                const targetTranslateY = (wave - 0.5) * 6;
                const translateY = initialTranslateY + (targetTranslateY - initialTranslateY) * 0.1;
      
                anime.set(path, {
                  stroke: color,
                  translateY,
                });
              } else {
                // Fuera de rango de onda, suaviza la vuelta al estado base
                const initialStroke = "rgba(80,80,80,.35)";
                const initialAlphaMatch = initialStroke.match(/rgba?\((\d+), (\d+), (\d+), ([\d.]+)\)/);
                let baseAlpha = 0.35;
                if (initialAlphaMatch) baseAlpha = Number(initialAlphaMatch[4]);
      
                const currentStroke = window.getComputedStyle(path).stroke;
                const currentAlphaMatch = currentStroke.match(/rgba?\((\d+), (\d+), (\d+), ([\d.]+)\)/);
                let currentAlpha = 0.35;
                if (currentAlphaMatch) currentAlpha = Number(currentAlphaMatch[4]);
      
                const alpha = currentAlpha + (baseAlpha - currentAlpha) * 0.1;
                const color = `rgba(80, 80, 80, ${alpha})`;
      
                const initialTranslateY = initialStates[i].translateY || 0;
                const currentTranslateY = parseFloat(path.style.transform?.match(/translateY\((-?\d+\.?\d*)px\)/)?.[1]) || 0;
                const translateY = currentTranslateY + (initialTranslateY - currentTranslateY) * 0.1;
      
                anime.set(path, {
                  stroke: color,
                  translateY,
                });
              }
            });
          },
          autoplay: true,
        });
      };
      
      
      
      

      runWaveAnimation(illuminatedPaths);

      // const totalDuration = 3000; // duración total de la ola
      // const waveDuration = 800;   // duración del efecto de cada path
      // const maxOffset = totalDuration - waveDuration;


      // anime({
      //   targets: spherePathEls,
      //   stroke: "rgba(80,80,80,.35)",
      //   duration: 300,
      //   easing: "easeOutQuad",
      //   // direction: "alternate",
      //   // loop: 2
      // });
      // smoothShutdown();
    };
  }, [props.pulseIntervalMs, props.playing]);


  return (
    <div ref={sphereRef} className="animation-container">
      <div className="animation-wrapper">
        <div className="sphere-animation ">
          < SphereSVG />
        </div>
      </div>
    </div>
  )
})

export default SphereAnimation