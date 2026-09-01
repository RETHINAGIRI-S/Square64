import { useState, useEffect } from "react";

const MESSAGES = {
  checkmate: (winnerIsPlayer) => (winnerIsPlayer ? "Checkmate — you win!" : "Checkmate — engine wins"),
  stalemate: () => "Stalemate — the game is drawn",
  draw: () => "Draw",
  resigned: () => "You resigned",
};

// End-game notification displaying match results with delay and undo option.
export default function GameOverModal({ status, winnerIsPlayer, onExit, onUndo, canUndo }) {
  const [dismissedStatus, setDismissedStatus] = useState(null);
  const [showCheckmate, setShowCheckmate] = useState(false);

  useEffect(() => {
    if (status !== "checkmate") return;

    const timer = setTimeout(() => {
      setShowCheckmate(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      setShowCheckmate(false);
    };
  }, [status]);

  if (!status || status === "playing") return null;
  if (dismissedStatus === status) return null;
  if (status === "checkmate" && !showCheckmate) return null;

  const message = MESSAGES[status]?.(winnerIsPlayer) ?? "Game over";

  const handleUndo = () => {
    if (onUndo) onUndo();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="false">
      <div className="modal-panel game-over-panel">
        <div className="notification-top-row">
          <p className="modal-eyebrow">Match Concluded</p>
          <button
            type="button"
            className="notification-close-btn"
            onClick={() => setDismissedStatus(status)}
            title="Review board"
          >
            ✕
          </button>
        </div>

        <h2 className="modal-heading">{message}</h2>

        <div className="modal-actions-row">
          {canUndo && (
            <button
              type="button"
              className="btn btn-control btn-large"
              onClick={handleUndo}
              title="Undo Move (Press Z)"
            >
              <span>↶</span>
              <span>Undo Move</span>
              <kbd className="btn-kbd">Z</kbd>
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={onExit}
          >
            Play Again →
          </button>
        </div>
      </div>
    </div>
  );
}
