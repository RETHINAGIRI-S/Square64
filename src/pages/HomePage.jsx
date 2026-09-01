import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DIFFICULTY_PRESETS } from "../hooks/useStockfish";
import ChessBoard from "../components/chessboard";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"];
const INITIAL_PREVIEW_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Home setup screen: navigates to /game with selected player setup.
export default function HomePage() {
  const navigate = useNavigate();
  const [color, setColor] = useState("w"); // "w" | "b" | "random"
  const [difficulty, setDifficulty] = useState("intermediate");

  const handleStart = () => {
    const resolvedColor = color === "random" ? (Math.random() < 0.5 ? "w" : "b") : color;
    const setupData = { color: resolvedColor, difficulty };
    try {
      sessionStorage.setItem("chess_game_setup", JSON.stringify(setupData));
      sessionStorage.removeItem("chess_game_state");
    } catch {
      // ignore storage quota errors
    }
    navigate("/game", { state: setupData });
  };

  const previewOrientation = color === "b" ? "black" : "white";

  return (
    <div className="home-container">
      {/* Left Setup Column */}
      <div className="home-left-col">
        <div className="home-brand-title">Square64</div>

        <div className="home-panel">
          <h1 className="home-title">Master the Board</h1>
          <p className="home-subtitle">
            Distraction-free chess against adaptive Stockfish AI engine.
          </p>

        {/* Color Selection */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-label">Play As</h2>
          </div>
          <div className="color-picker">
            <button
              type="button"
              className={`color-card ${color === "w" ? "is-selected" : ""}`}
              onClick={() => setColor("w")}
            >
              <span className="color-icon">♔</span>
              <span className="color-title">White</span>
              <span className="color-sub">Plays first</span>
            </button>

            <button
              type="button"
              className={`color-card ${color === "b" ? "is-selected" : ""}`}
              onClick={() => setColor("b")}
            >
              <span className="color-icon">♚</span>
              <span className="color-title">Black</span>
              <span className="color-sub">Defends</span>
            </button>

            <button
              type="button"
              className={`color-card ${color === "random" ? "is-selected" : ""}`}
              onClick={() => setColor("random")}
            >
              <span className="color-icon">⇄</span>
              <span className="color-title">Random</span>
              <span className="color-sub">50/50 toss</span>
            </button>
          </div>
        </section>

        {/* Difficulty Selection */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-label">Difficulty</h2>
          </div>
          <div className="difficulty-picker">
            {DIFFICULTY_ORDER.map((key) => {
              const preset = DIFFICULTY_PRESETS[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`difficulty-card ${difficulty === key ? "is-selected" : ""}`}
                  onClick={() => setDifficulty(key)}
                >
                  <span className="difficulty-title">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Start Game Action */}
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={handleStart}
        >
          Start Game →
        </button>
      </div>
    </div>

      {/* Right Preview Board */}
      <div className="home-preview-wrapper">
        <div className="home-preview-board">
          <ChessBoard
            fen={INITIAL_PREVIEW_FEN}
            orientation={previewOrientation}
            isPlayerTurn={false}
          />
        </div>
      </div>
    </div>
  );
}
