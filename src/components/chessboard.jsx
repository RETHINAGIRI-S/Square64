import { useMemo, useState, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const LAST_MOVE_COLOR = "rgba(148, 163, 184, 0.40)"; // soft slate highlight
const SELECTED_COLOR = "rgba(255, 255, 255, 0.28)"; // clean white glow
const CHECK_COLOR = "rgba(239, 68, 68, 0.65)"; // warning red

// Presentational wrapper around react-chessboard handling moves, drag-and-drop, and visual highlights.
export default function ChessBoard({
  fen,
  onMove,
  orientation = "white",
  isPlayerTurn = true,
  lastMove = null,
  checkSquare = null,
}) {
  const [moveFrom, setMoveFrom] = useState("");

  // Calculate legal destination squares for the currently selected piece
  const legalMoves = useMemo(() => {
    if (!moveFrom || !fen) return [];
    try {
      const game = new Chess(fen);
      return game.moves({ square: moveFrom, verbose: true }).map((m) => m.to);
    } catch {
      return [];
    }
  }, [fen, moveFrom]);

  // Generate square highlights: last moves, selected piece, check, and legal destination dots/rings
  const squareStyles = useMemo(() => {
    const styles = {};

    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: LAST_MOVE_COLOR };
      styles[lastMove.to] = { backgroundColor: LAST_MOVE_COLOR };
    }

    if (moveFrom) {
      styles[moveFrom] = {
        backgroundColor: SELECTED_COLOR,
        boxShadow: "inset 0 0 0 2px #FFFFFF",
      };
    }

    // Highlight legal target moves
    if (moveFrom && legalMoves.length > 0) {
      try {
        const game = new Chess(fen);
        legalMoves.forEach((square) => {
          const isOccupied = Boolean(game.get(square));
          styles[square] = isOccupied
            ? {
                background:
                  "radial-gradient(circle, transparent 52%, rgba(255, 255, 255, 0.5) 54%, rgba(255, 255, 255, 0.5) 70%, transparent 72%)",
                cursor: "pointer",
              }
            : {
                background:
                  "radial-gradient(circle, rgba(255, 255, 255, 0.55) 24%, transparent 26%)",
                cursor: "pointer",
              };
        });
      } catch {
        // fallback
      }
    }

    // Check takes priority over other styling
    if (checkSquare) {
      styles[checkSquare] = { backgroundColor: CHECK_COLOR };
    }

    return styles;
  }, [lastMove, moveFrom, checkSquare, legalMoves, fen]);

  // Drag & drop move execution
  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (!isPlayerTurn || !onMove || !targetSquare) return false;
      const success = onMove(sourceSquare, targetSquare);
      setMoveFrom("");
      return Boolean(success);
    },
    [isPlayerTurn, onMove]
  );

  // Click-to-move handler
  const handleSquareClick = useCallback(
    ({ square }) => {
      if (!isPlayerTurn || !onMove) return;

      // Clicked on the currently selected square -> unselect
      if (moveFrom === square) {
        setMoveFrom("");
        return;
      }

      // If a piece is already selected and target is a legal move -> perform move
      if (moveFrom) {
        if (legalMoves.includes(square)) {
          onMove(moveFrom, square);
          setMoveFrom("");
          return;
        }
      }

      // Otherwise, select piece if it's the current player's piece
      try {
        const game = new Chess(fen);
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setMoveFrom(square);
          return;
        }
      } catch {
        // fallback
      }

      setMoveFrom("");
    },
    [moveFrom, legalMoves, isPlayerTurn, onMove, fen]
  );

  return (
    <div className="chessboard-wrapper">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: isPlayerTurn && Boolean(onMove),
          onPieceDrop: handlePieceDrop,
          onSquareClick: handleSquareClick,
          onPieceClick: ({ square }) => {
            if (square) handleSquareClick({ square });
          },
          squareStyles: squareStyles,
          boardStyle: {
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          },
          darkSquareStyle: { backgroundColor: "#475569" },
          lightSquareStyle: { backgroundColor: "#E2E8F0" },
          animationDurationInMs: 180,
        }}
      />
    </div>
  );
}
