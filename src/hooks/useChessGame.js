import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Chess } from "chess.js";
import useStockfish from "./useStockfish";
import useSound from "./useSound";

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const FILES = "abcdefgh";

// Derives captured pieces and material score differential from move history.
function deriveCaptures(history) {
  const captured = { w: [], b: [] };

  for (const move of history) {
    if (!move.captured) continue;
    // The side that made the capturing move gains the captured piece.
    const capturer = move.color;
    captured[capturer].push(move.captured);
  }

  const valueOf = (pieces) => pieces.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  const materialDiff = valueOf(captured.w) - valueOf(captured.b);

  return { captured, materialDiff };
}

/** Finds the square (e.g. "e1") of the given color's king, for check highlighting. */
function findKingSquare(game, color) {
  const board = game.board();
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      if (square && square.type === "k" && square.color === color) {
        return `${FILES[file]}${8 - rank}`;
      }
    }
  }
  return null;
}

function isInCheck(game) {
  if (typeof game.isCheck === "function") return game.isCheck();
  if (typeof game.in_check === "function") return game.in_check();
  return false;
}

// Coordinates chess.js game state, user input, Stockfish engine, and audio.
const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function loadInitialGameState() {
  try {
    const raw = sessionStorage.getItem("chess_game_state");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.fen) {
        const game = new Chess(parsed.fen);
        return {
          game,
          fen: parsed.fen,
          turn: game.turn(),
          history: Array.isArray(parsed.history) ? parsed.history : game.history({ verbose: true }),
          status: parsed.status || "playing",
          lastMove: parsed.lastMove || null,
          checkSquare: parsed.checkSquare || null,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to restore game state from sessionStorage", e);
  }

  const game = new Chess();
  return {
    game,
    fen: INITIAL_FEN,
    turn: "w",
    history: [],
    status: "playing",
    lastMove: null,
    checkSquare: null,
  };
}

export default function useChessGame({ playerColor = "w", difficulty = "intermediate" } = {}) {
  const [initial] = useState(() => loadInitialGameState());
  const gameRef = useRef(initial.game);
  const [fen, setFen] = useState(initial.fen);
  const [turn, setTurn] = useState(initial.turn);
  const [history, setHistory] = useState(initial.history);
  const [status, setStatus] = useState(initial.status);
  const [lastMove, setLastMove] = useState(initial.lastMove);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }
  const [checkSquare, setCheckSquare] = useState(initial.checkSquare);

  const { isReady, isThinking, requestMove, setDifficulty } = useStockfish(difficulty);
  const playSound = useSound();

  useEffect(() => {
    setDifficulty(difficulty);
  }, [difficulty, setDifficulty]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "chess_game_state",
        JSON.stringify({
          fen,
          history,
          status,
          lastMove,
          checkSquare,
        })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [fen, history, status, lastMove, checkSquare]);

  const syncFromGame = useCallback(() => {
    const game = gameRef.current;
    setFen(game.fen());
    setTurn(game.turn());
    setHistory(game.history({ verbose: true }));

    if (game.isCheckmate()) setStatus("checkmate");
    else if (game.isStalemate()) setStatus("stalemate");
    else if (game.isDraw()) setStatus("draw");
    else setStatus("playing");

    const inCheck = isInCheck(game);
    setCheckSquare(inCheck ? findKingSquare(game, game.turn()) : null);
  }, []);

  const isPlayerTurn = turn === playerColor && status === "playing";

  const isPromotionMove = useCallback((from, to) => {
    const game = gameRef.current;
    const piece = game.get(from);
    if (!piece || piece.type !== "p") return false;
    const legalMoves = game.moves({ square: from, verbose: true });
    return legalMoves.some((m) => m.to === to && m.promotion);
  }, []);

  const commitMove = useCallback(
    (from, to, promotion) => {
      const game = gameRef.current;
      let move;
      try {
        move = game.move({ from, to, promotion: promotion || "q" });
      } catch {
        return false;
      }
      if (!move) return false;

      setLastMove({ from: move.from, to: move.to });
      syncFromGame();

      // Sound priority: checkmate > check > capture > plain move.
      if (game.isCheckmate()) playSound("checkmate");
      else if (isInCheck(game)) playSound("check");
      else if (move.captured) playSound("capture");
      else playSound("move");

      return true;
    },
    [syncFromGame, playSound]
  );

  // Attempts a move: intercepts promotions for dialog selection or commits directly.
  const attemptMove = useCallback(
    (from, to) => {
      if (!isPlayerTurn) return false;

      if (isPromotionMove(from, to)) {
        setPendingPromotion({ from, to });
        return false;
      }

      return commitMove(from, to);
    },
    [isPlayerTurn, isPromotionMove, commitMove]
  );

  const resolvePromotion = useCallback(
    (piece) => {
      if (!pendingPromotion) return;
      const { from, to } = pendingPromotion;
      setPendingPromotion(null);
      commitMove(from, to, piece);
    },
    [pendingPromotion, commitMove]
  );

  const cancelPromotion = useCallback(() => setPendingPromotion(null), []);

  // Trigger Stockfish whenever it becomes the engine's turn.
  useEffect(() => {
    if (status !== "playing") return;
    if (turn === playerColor) return;
    if (!isReady) return;

    let cancelled = false;

    requestMove(fen).then((uciMove) => {
      if (cancelled || !uciMove) return;
      const from = uciMove.slice(0, 2);
      const to = uciMove.slice(2, 4);
      const promotion = uciMove.slice(4, 5) || undefined;
      commitMove(from, to, promotion);
    });

    return () => {
      cancelled = true;
    };
  }, [fen, turn, status, isReady, playerColor, requestMove, commitMove]);

  const resign = useCallback(() => setStatus("resigned"), []);

  const newGame = useCallback(() => {
    gameRef.current = new Chess();
    setLastMove(null);
    setPendingPromotion(null);
    setCheckSquare(null);
    try {
      sessionStorage.removeItem("chess_game_state");
    } catch {
      // ignore
    }
    syncFromGame();
  }, [syncFromGame]);

  const { captured, materialDiff } = useMemo(() => deriveCaptures(history), [history]);

  return {
    fen,
    history,
    status,
    lastMove,
    checkSquare,
    isPlayerTurn,
    isThinking,
    isEngineReady: isReady,
    pendingPromotion,
    captured,
    materialDiff,
    attemptMove,
    resolvePromotion,
    cancelPromotion,
    resign,
    newGame,
    turn,
    isCheck: checkSquare !== null,
  };
}
