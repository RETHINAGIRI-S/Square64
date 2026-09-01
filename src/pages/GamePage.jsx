import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CapturedPieces from "../components/CapturedPieces";
import MoveHistory from "../components/MoveHistory";
import GameOverModal from "../components/GameOverModal";
import PromotionDialog from "../components/PromotionDialog";
import useChessGame from "../hooks/useChessGame";
import ChessBoard from "../components/chessboard";

// Restores game setup from router state or sessionStorage across reloads.
export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const setup = (() => {
    if (location.state?.color && location.state?.difficulty) {
      return location.state;
    }
    try {
      const stored = sessionStorage.getItem("chess_game_setup");
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return null;
  })();

  useEffect(() => {
    if (!setup) navigate("/", { replace: true });
  }, [setup, navigate]);

  if (!setup) return null;

  const handleExit = () => {
    try {
      sessionStorage.removeItem("chess_game_setup");
      sessionStorage.removeItem("chess_game_state");
    } catch {
      // ignore
    }
    navigate("/");
  };

  return <GameBoard playerColor={setup.color} difficulty={setup.difficulty} onExit={handleExit} />;
}

function GameBoard({ playerColor, difficulty, onExit }) {
  const {
    fen,
    history,
    status,
    lastMove,
    checkSquare,
    isPlayerTurn,
    isThinking,
    isEngineReady,
    pendingPromotion,
    captured,
    materialDiff,
    attemptMove,
    resolvePromotion,
    cancelPromotion,
    resign,
    turn,
    isCheck,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useChessGame({ playerColor, difficulty });

  const orientation = playerColor === "w" ? "white" : "black";
  const winnerIsPlayer = status === "checkmate" && turn !== playerColor;

  // Keyboard shortcuts: Press Z for Undo, X for Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const key = e.key.toLowerCase();
      if (key === "z") {
        if (canUndo) {
          e.preventDefault();
          undo();
        }
      } else if (key === "x") {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div className="game-container">
      {/* Top Header Bar */}
      <header className="game-header">
        <div className="game-header-left">
          <button type="button" className="btn-back" onClick={onExit}>
            <span>←</span>
            <span>Menu</span>
          </button>
          <span className="game-tag">Stockfish ({difficulty})</span>
        </div>

        <div className="turn-status-badge">
          <span className={`turn-pulse ${isThinking ? "is-thinking" : ""}`} />
          <span>
            {status === "playing" ? (
              isThinking ? (
                "Engine is thinking…"
              ) : isPlayerTurn ? (
                "Your move"
              ) : !isEngineReady ? (
                "Connecting engine…"
              ) : (
                "Engine's move"
              )
            ) : status === "checkmate" ? (
              winnerIsPlayer ? "Victory • Checkmate" : "Defeat • Checkmate"
            ) : (
              "Match Concluded"
            )}
            {isCheck && status === "playing" && " (Check)"}
          </span>
        </div>
      </header>

      {/* Main Game Layout */}
      <div className="game-layout">
        {/* Left Board Panel */}
        <div className="game-board-panel">
          <ChessBoard
            fen={fen}
            onMove={attemptMove}
            orientation={orientation}
            isPlayerTurn={isPlayerTurn}
            lastMove={lastMove}
            checkSquare={checkSquare}
          />

          {pendingPromotion && (
            <PromotionDialog
              color={playerColor}
              onSelect={resolvePromotion}
              onCancel={cancelPromotion}
            />
          )}

          <div className="game-controls-bar">
            <div className="game-action-buttons">
              <button
                type="button"
                className="btn btn-control"
                onClick={undo}
                disabled={!canUndo}
                title="Undo move (Press Z)"
              >
                <span>↶</span>
                <span>Undo</span>
                <kbd className="btn-kbd">Z</kbd>
              </button>
              <button
                type="button"
                className="btn btn-control"
                onClick={redo}
                disabled={!canRedo}
                title="Redo move (Press X)"
              >
                <span>↷</span>
                <span>Redo</span>
                <kbd className="btn-kbd">X</kbd>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-resign"
              onClick={resign}
              disabled={status !== "playing"}
            >
              Resign
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="game-sidebar">
          <section className="sidebar-card">
            <h2 className="sidebar-title">Captured Material</h2>
            <CapturedPieces
              captured={captured}
              materialDiff={materialDiff}
              playerColor={playerColor}
            />
          </section>

          <section className="sidebar-card sidebar-card-grow">
            <h2 className="sidebar-title">Move History</h2>
            <MoveHistory history={history} playerColor={playerColor} />
          </section>
        </aside>
      </div>

      <GameOverModal
        status={status}
        winnerIsPlayer={winnerIsPlayer}
        onExit={onExit}
        onUndo={undo}
        canUndo={canUndo}
      />
    </div>
  );
}
