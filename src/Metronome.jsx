import { useState, useEffect, useRef } from "react";
import "./index.css";
import Button from "./Button";
import SphereSVG from "./SphereSVG";
import SphereAnimation from "./SphereAnimation";

export default function Metronome() {
    const [bpm, setBpm] = useState(60);
    const [playing, setPlaying] = useState(false);
    const [active, setActive] = useState(false);
    const [volume, setVolume] = useState(1); // Volumen de 0 a 1
    const [elapsed, setElapsed] = useState(() => {
        const saved = localStorage.getItem("metronome_elapsed");
        return saved ? Number(saved) : 0;
    });

    const audioCtx = useRef(null);
    const gainNode = useRef(null); // Nuevo: referencia al GainNode
    const clickBuffer = useRef(null);
    const nextNoteTime = useRef(0);
    const schedulerInterval = useRef(null);
    const sliderRef = useRef(null);
    const volumeSliderRef = useRef(null);
    const intervalRef = useRef(null);

    const sphereRef = useRef(null);

    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s

    // Cargar audio y crear GainNode
    useEffect(() => {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        gainNode.current = audioCtx.current.createGain();
        gainNode.current.gain.value = volume;
        gainNode.current.connect(audioCtx.current.destination);

        fetch("/sounds/sound1.mp3")
            .then((res) => res.arrayBuffer())
            .then((buffer) => audioCtx.current.decodeAudioData(buffer))
            .then((decoded) => {
                clickBuffer.current = decoded;
                console.log("Audio cargado");
            });
    }, []);

    // Actualizar volumen del GainNode cuando cambie el estado
    useEffect(() => {
        if (gainNode.current) {
            gainNode.current.gain.value = volume;
        }
    }, [volume]);

    const scheduleClick = (time) => {
        const source = audioCtx.current.createBufferSource();
        source.buffer = clickBuffer.current;
        source.connect(gainNode.current); // Conectar al GainNode
        source.start(time);

        // Efecto visual
        setTimeout(() => setActive(true), (time - audioCtx.current.currentTime) * 1000);
        setTimeout(() => setActive(false), (time - audioCtx.current.currentTime) * 1000 + 150);

        console.log(`Click programado en: ${time.toFixed(3)} (ahora: ${audioCtx.current.currentTime.toFixed(3)})`);
    };

    const scheduler = () => {
        while (nextNoteTime.current < audioCtx.current.currentTime + scheduleAheadTime) {
            scheduleClick(nextNoteTime.current);
            const secondsPerBeat = 60.0 / bpm;
            nextNoteTime.current += secondsPerBeat;
        }
    };

    const startMetronome = () => {
        nextNoteTime.current = audioCtx.current.currentTime + 0.1; // empezar 100ms en el futuro
        schedulerInterval.current = setInterval(scheduler, lookahead);
        setPlaying(true);
    };

    const stopMetronome = () => {
        clearInterval(schedulerInterval.current);
        setPlaying(false);
    };

    const toggleMetronome = () => {
        if (playing) {
            stopMetronome();
        } else {
            startMetronome();
        }
    };

    const handleBpmChange = (newBpm) => {
        newBpm = Math.min(200, Math.max(40, newBpm));
        setBpm(newBpm);
    };

    useEffect(() => {
        if (playing) {
            stopMetronome();
            startMetronome();
        }
    }, [bpm]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === " ") {
                e.preventDefault();
                toggleMetronome();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [playing, bpm]);

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            handleBpmChange(bpm - delta);
        };

        slider.addEventListener("wheel", handleWheel);
        return () => slider.removeEventListener("wheel", handleWheel);
    }, [bpm]);

    useEffect(() => {
        return () => clearInterval(schedulerInterval.current);
    }, []);

    useEffect(() => {
        const slider = volumeSliderRef.current;
        if (!slider) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            setVolume((prev) => {
                let newVolume = prev - delta * 0.01;
                newVolume = Math.max(0, Math.min(1, parseFloat(newVolume.toFixed(2))));
                return newVolume;
            });
        };

        slider.addEventListener("wheel", handleWheel);
        return () => slider.removeEventListener("wheel", handleWheel);
    }, []);

    useEffect(() => {
        const button = document.querySelector(".metronome-button");
        if (!button) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            handleBpmChange(bpm - delta);
        };

        button.addEventListener("wheel", handleWheel);
        return () => button.removeEventListener("wheel", handleWheel);
    }, [bpm]);

    // Incrementa el contador solo cuando playing es true
    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                setElapsed(prev => {
                    const next = prev + 1;
                    localStorage.setItem("metronome_elapsed", next);
                    return next;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [playing]);

    // Botón para resetear el contador
    const handleResetElapsed = () => {
        setElapsed(0);
        localStorage.setItem("metronome_elapsed", "0");
    };

    return (
        <>
            <div className="wrapper">
                <input
                    id="volume"
                    ref={volumeSliderRef}
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                />
            </div>

            <div className="metronome-center flex flex-col items-center justify-center min-h-screen w-full">
                {/* Contador de tiempo y botón de reset */}
                <div className="flex flex-row items-center mb-4 gap-2">
                    <span className="text-sm text-gray-300">
                        Tiempo activo: {elapsed}s
                    </span>
                    <button
                        className="px-2 py-1 rounded bg-gray-700 text-white text-xs hover:bg-red-500"
                        onClick={handleResetElapsed}
                        title="Resetear contador"
                    >
                        Reset
                    </button>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex justify-center items-center">
                        <SphereAnimation
                            pulseIntervalMs={60000 / bpm}
                            playing={playing}
                        />
                        <Button bpm={bpm} toggleMetronome={toggleMetronome} />
                    </div>
                    <div id="slider-container">
                        <input
                            id="slider"
                            ref={sliderRef}
                            type="range"
                            min="40"
                            max="200"
                            value={bpm}
                            onChange={(e) => handleBpmChange(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
