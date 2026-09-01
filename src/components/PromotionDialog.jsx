const PIECES = [
  { code: "q", label: "Queen" },
  { code: "r", label: "Rook" },
  { code: "b", label: "Bishop" },
  { code: "n", label: "Knight" },
];

const GLYPHS = {
  w: { q: "♕", r: "♖", b: "♗", n: "♘" },
  b: { q: "♛", r: "♜", b: "♝", n: "♞" },
};

// Dialog for selecting pawn promotion piece (Queen, Rook, Bishop, Knight).
export default function PromotionDialog({ color = "w", onSelect, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-label="Choose promotion piece">
      <div className="promotion-dialog-panel">
        <p className="promotion-title">Promote Pawn</p>
        <div className="promotion-grid">
          {PIECES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              className="promotion-btn"
              onClick={() => onSelect(code)}
              aria-label={label}
            >
              <span className="promotion-glyph">{GLYPHS[color][code]}</span>
              <span className="promotion-label">{label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline" style={{ width: "100%", marginTop: "8px" }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
