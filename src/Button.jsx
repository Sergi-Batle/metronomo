import "./index.css";

export default function Button({bpm, toggleMetronome}) {
  return (
    <div>
      <button id="start-stop" className="metronome-button" onClick={toggleMetronome}>
        <div className="bg-playing"></div>
        <div className="bg"></div>
        <div className="container">
          <div className="tempo">{bpm}</div>
          <div className="bpm">BPM</div>
          <div className="hint"></div>
        </div>
      </button>
    </div>

  )
}