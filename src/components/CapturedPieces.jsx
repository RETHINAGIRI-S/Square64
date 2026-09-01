const GLYPHS = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
};

const ORDER = ["q", "r", "b", "n", "p"];

function sortPieces(pieces) {
  return [...pieces].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

// Displays captured pieces and material point difference for both players.
export default function CapturedPieces({ captured, materialDiff, playerColor = "w" }) {
  const opponentColor = playerColor === "w" ? "b" : "w";

  const playerCaptures = sortPieces(captured[playerColor] || []);
  const opponentCaptures = sortPieces(captured[opponentColor] || []);

  const playerAdvantage = playerColor === "w" ? materialDiff : -materialDiff;

  return (
    <div className="captured-tray">
      <div className="captured-row">
        <span className="captured-label">You</span>
        <div className="captured-pieces-list">
          {playerCaptures.length === 0 && <span className="captured-empty">—</span>}
          {playerCaptures.map((piece, i) => (
            <span key={`${piece}-${i}`} className="captured-piece" aria-label={piece}>
              {GLYPHS[piece]}
            </span>
          ))}
        </div>
        {playerAdvantage > 0 && <span className="captured-diff-pill">+{playerAdvantage}</span>}
      </div>

      <div className="captured-row">
        <span className="captured-label">Opponent</span>
        <div className="captured-pieces-list">
          {opponentCaptures.length === 0 && <span className="captured-empty">—</span>}
          {opponentCaptures.map((piece, i) => (
            <span key={`${piece}-${i}`} className="captured-piece" aria-label={piece}>
              {GLYPHS[piece]}
            </span>
          ))}
        </div>
        {playerAdvantage < 0 && <span className="captured-diff-pill">+{-playerAdvantage}</span>}
      </div>
    </div>
  );
}
