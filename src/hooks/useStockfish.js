import { useEffect, useRef, useCallback, useState } from "react";

// Difficulty presets configuring Stockfish skill level, search depth, and move time.
export const DIFFICULTY_PRESETS = {
  beginner: { label: "Beginner", maxElo: 600, skill: 0, depth: 3, moveTime: 150, uciElo: 1320 },
  intermediate: { label: "Intermediate", maxElo: 1500, skill: 9, depth: 7, moveTime: 500, uciElo: 1500 },
  advanced: { label: "Advanced / Expert", maxElo: 2200, skill: 20, depth: 14, moveTime: 1400, uciElo: 2200 },
};

// Web Worker hook managing Stockfish UCI commands and asynchronous move requests.
export default function useStockfish(initialDifficulty = "intermediate") {
  const workerRef = useRef(null);
  const pendingResolveRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [difficulty, setDifficultyState] = useState(initialDifficulty);

  useEffect(() => {
    const worker = new Worker("/stockfish.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = typeof e.data === "string" ? e.data : e.data?.data;
      if (!line) return;

      if (line === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (line === "readyok") {
        setIsReady(true);
        return;
      }

      if (line.startsWith("bestmove")) {
        const [, best] = line.split(" ");
        setIsThinking(false);
        if (pendingResolveRef.current) {
          pendingResolveRef.current(best === "(none)" ? null : best);
          pendingResolveRef.current = null;
        }
      }
    };

    worker.onerror = (err) => {
      console.error("Stockfish worker error:", err);
      setIsThinking(false);
    };

    worker.postMessage("uci");

    return () => {
      if (pendingResolveRef.current) {
        pendingResolveRef.current(null);
        pendingResolveRef.current = null;
      }
      try {
        worker.postMessage("quit");
        worker.terminate();
      } catch {
        // ignore termination errors on unmount
      }
      workerRef.current = null;
    };
  }, []);

  const applyDifficulty = useCallback((key) => {
    const preset = DIFFICULTY_PRESETS[key] ?? DIFFICULTY_PRESETS.intermediate;
    const worker = workerRef.current;
    worker?.postMessage(`setoption name Skill Level value ${preset.skill}`);
    worker?.postMessage("setoption name UCI_LimitStrength value true");
    worker?.postMessage(`setoption name UCI_Elo value ${preset.uciElo}`);
    return preset;
  }, []);

  const setDifficulty = useCallback(
    (key) => {
      setDifficultyState(key);
      if (isReady) applyDifficulty(key);
    },
    [isReady, applyDifficulty]
  );

  useEffect(() => {
    if (isReady) applyDifficulty(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const requestMove = useCallback(
    (fen) => {
      const worker = workerRef.current;
      if (!worker || !isReady) return Promise.resolve(null);

      const preset = DIFFICULTY_PRESETS[difficulty] ?? DIFFICULTY_PRESETS.intermediate;

      return new Promise((resolve) => {
        if (pendingResolveRef.current) {
          pendingResolveRef.current(null);
        }
        pendingResolveRef.current = resolve;
        setIsThinking(true);
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${preset.depth} movetime ${preset.moveTime}`);
      });
    },
    [isReady, difficulty]
  );

  const stop = useCallback(() => {
    workerRef.current?.postMessage("stop");
    if (pendingResolveRef.current) {
      pendingResolveRef.current(null);
      pendingResolveRef.current = null;
    }
    setIsThinking(false);
  }, []);

  return { isReady, isThinking, requestMove, setDifficulty, difficulty, stop };
}
