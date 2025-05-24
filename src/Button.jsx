import "./index.css";

export default function Button({ bpm, toggleMetronome }) {
  return (
    <div>
      <button id="start-stop" className="metronome-button" onClick={toggleMetronome}>
        <div className="bg-playing"></div>
        <div className="bg"></div>
        <div className="container">
          <div id="data" className="flex items-end justify-center">
            <div className="tempo">{bpm}</div>
            <div className="bpm ml-1">BPM</div>
          </div>

          <div className="hint"></div>
        </div>
      </button>
    </div>

  )
}