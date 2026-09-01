const MESSAGES = {
  checkmate: (winnerIsPlayer) => (winnerIsPlayer ? "Checkmate — you win" : "Checkmate — engine wins"),
  stalemate: () => "Stalemate — the game is drawn",
  draw: () => "Draw",
  resigned: () => "You resigned",
};

// End-game dialog displaying match results and redirecting to home on rematch.
export default function GameOverModal({ status, winnerIsPlayer, onExit }) {
  if (!status || status === "playing") return null;

  const message = MESSAGES[status]?.(winnerIsPlayer) ?? "Game over";

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <p className="modal-eyebrow">Match Concluded</p>
        <h2 className="modal-heading">{message}</h2>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary btn-large" onClick={onExit}>
            Play Again →
          </button>
        </div>
      </div>
    </div>
  );
}
