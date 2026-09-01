import { useEffect, useRef } from "react";

// Renders move list paired by round with You/Engine column indicators.
export default function MoveHistory({ history, playerColor = "w" }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history.length]);

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      number: i / 2 + 1,
      white: history[i]?.san,
      black: history[i + 1]?.san,
    });
  }

  const whiteLabel = playerColor === "w" ? "You" : "Engine";
  const blackLabel = playerColor === "w" ? "Engine" : "You";

  return (
    <div className="move-history-wrapper">
      <div className="move-history-header">
        <span className="move-header-num">#</span>
        <span className="move-header-col">
          <span className="move-header-dot dot-white" />
          <span>{whiteLabel}</span>
        </span>
        <span className="move-header-col">
          <span className="move-header-dot dot-black" />
          <span>{blackLabel}</span>
        </span>
      </div>

      <div className="move-history-container" ref={listRef}>
        {pairs.length === 0 ? (
          <p className="move-history-empty">No moves yet</p>
        ) : (
          <table className="move-history-table">
            <tbody>
              {pairs.map((pair) => (
                <tr key={pair.number} className="move-history-row">
                  <td className="move-num">{pair.number}.</td>
                  <td className="move-col">{pair.white}</td>
                  <td className="move-col">{pair.black ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
