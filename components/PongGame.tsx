"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const GW = 800, GH = 500;
const PADDLE_H = 80, PADDLE_W = 12, PADDLE_MARGIN = 16;
const BALL_R = 8;

type Role = "left" | "right";
type Opponent = "human" | "ai";
type Phase =
  | { name: "connecting" }
  | { name: "waiting"; secondsLeft: number }
  | { name: "playing"; role: Role; opponent: Opponent }
  | { name: "done"; role: Role; winner: "left" | "right"; opponent: Opponent }
  | { name: "opponent_left" }
  | { name: "error" };

interface GameState {
  ball: { x: number; y: number };
  left: { y: number; score: number };
  right: { y: number; score: number };
  status: "playing" | "scored" | "done";
  winner: "left" | "right" | null;
}

function drawFrame(ctx: CanvasRenderingContext2D, gs: GameState, role: Role) {
  // Background
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, GW, GH);

  // Center dashes
  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(GW / 2, 0);
  ctx.lineTo(GW / 2, GH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scores
  ctx.font = "bold 52px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(gs.left.score), GW / 2 - 90, 20);
  ctx.fillText(String(gs.right.score), GW / 2 + 90, 20);

  // "YOU" label under your score
  ctx.font = "11px monospace";
  ctx.fillStyle = "#3b82f6";
  if (role === "left")  ctx.fillText("YOU", GW / 2 - 90, 76);
  if (role === "right") ctx.fillText("YOU", GW / 2 + 90, 76);

  // Left paddle
  ctx.fillStyle = role === "left" ? "#3b82f6" : "#e2e8f0";
  roundRect(ctx, PADDLE_MARGIN, gs.left.y, PADDLE_W, PADDLE_H, 4);

  // Right paddle
  ctx.fillStyle = role === "right" ? "#3b82f6" : "#e2e8f0";
  roundRect(ctx, GW - PADDLE_MARGIN - PADDLE_W, gs.right.y, PADDLE_W, PADDLE_H, 4);

  // Ball
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(gs.ball.x, gs.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const gsRef = useRef<GameState | null>(null);
  const roleRef = useRef<Role>("left");
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const dirRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>({ name: "connecting" });
  const [scale, setScale] = useState(1);

  // Scale canvas to fit viewport
  useEffect(() => {
    function resize() {
      const vw = window.innerWidth - 32;
      const vh = window.innerHeight - 200;
      setScale(Math.min(1, vw / GW, vh / GH));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Countdown for waiting phase
  useEffect(() => {
    if (phase.name !== "waiting") return;
    if (phase.secondsLeft <= 0) return;
    const t = setTimeout(
      () => setPhase((p) => p.name === "waiting" ? { name: "waiting", secondsLeft: p.secondsLeft - 1 } : p),
      1000
    );
    return () => clearTimeout(t);
  }, [phase]);

  // Render loop
  useEffect(() => {
    if (phase.name !== "playing" && phase.name !== "done") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function loop() {
      if (gsRef.current) drawFrame(ctx, gsRef.current, roleRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase.name]);

  // Input → server
  const sendDir = useCallback((dir: number) => {
    if (dir === dirRef.current) return;
    dirRef.current = dir;
    wsRef.current?.send(JSON.stringify({ type: "input", dir }));
  }, []);

  useEffect(() => {
    if (phase.name !== "playing") return;

    function computeDir() {
      const up   = keysRef.current.has("ArrowUp")   || keysRef.current.has("w") || keysRef.current.has("W");
      const down = keysRef.current.has("ArrowDown")  || keysRef.current.has("s") || keysRef.current.has("S");
      return up && !down ? -1 : down && !up ? 1 : 0;
    }

    function onKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key);
      sendDir(computeDir());
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key);
      sendDir(computeDir());
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [phase.name, sendDir]);

  // WebSocket connection
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/pong-ws`);
    wsRef.current = ws;

    ws.onopen = () => setPhase({ name: "waiting", secondsLeft: 5 });

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "waiting") {
        setPhase({ name: "waiting", secondsLeft: 5 });
      } else if (msg.type === "start") {
        roleRef.current = msg.role;
        setPhase({ name: "playing", role: msg.role, opponent: msg.opponent });
      } else if (msg.type === "state") {
        gsRef.current = msg.state;
        if (msg.state.status === "done") {
          setPhase((p) =>
            p.name === "playing"
              ? { name: "done", role: p.role, winner: msg.state.winner, opponent: p.opponent }
              : p
          );
        }
      } else if (msg.type === "opponent_left") {
        setPhase({ name: "opponent_left" });
      }
    };

    ws.onerror = (e) => { console.error("WS error", e); setPhase({ name: "error" }); };
    ws.onclose = (e) => {
      console.log("WS closed", e.code, e.reason);
      if (wsRef.current === ws) wsRef.current = null;
      setPhase((p) => p.name === "connecting" || p.name === "waiting" ? { name: "error" } : p);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  // Touch controls
  const touchDir = useCallback((dir: number) => sendDir(dir), [sendDir]);

  const isPlaying = phase.name === "playing" || phase.name === "done";

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Labs</Link>
        <span className="text-xs text-gray-600 uppercase tracking-widest">Pong</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6">
        {/* Status banner */}
        <div className="h-8 flex items-center">
          {phase.name === "connecting" && (
            <p className="text-gray-500 text-sm">Connecting…</p>
          )}
          {phase.name === "waiting" && (
            <p className="text-gray-400 text-sm">
              Looking for an opponent… starting vs AI in{" "}
              <span className="text-white font-mono">{phase.secondsLeft}s</span>
            </p>
          )}
          {phase.name === "playing" && (
            <p className="text-gray-500 text-sm">
              vs {phase.opponent === "ai" ? "AI" : "Human"} —{" "}
              <span className="text-blue-400">you are {phase.role}</span>
            </p>
          )}
          {phase.name === "done" && (
            <p className={`text-sm font-semibold ${phase.winner === phase.role ? "text-green-400" : "text-red-400"}`}>
              {phase.winner === phase.role ? "You win! 🎉" : "You lose."}
            </p>
          )}
          {phase.name === "opponent_left" && (
            <p className="text-yellow-400 text-sm">Opponent disconnected.</p>
          )}
          {phase.name === "error" && (
            <p className="text-red-400 text-sm">Connection failed.</p>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={wrapRef}
          style={{ width: GW * scale, height: GH * scale, position: "relative" }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: GW, height: GH }}>
            <canvas
              ref={canvasRef}
              width={GW}
              height={GH}
              className="rounded-xl border border-gray-800"
            />
            {/* Overlay for non-playing states */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(5,5,5,0.85)" }}
              >
                {phase.name === "connecting" && <Spinner />}
                {phase.name === "waiting" && (
                  <div className="text-center">
                    <Spinner />
                    <p className="text-gray-300 mt-4 text-sm">Waiting for opponent…</p>
                  </div>
                )}
                {(phase.name === "done" || phase.name === "opponent_left" || phase.name === "error") && (
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-white text-gray-900 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Play Again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Touch controls (mobile) */}
        {isPlaying && (
          <div className="flex gap-6 sm:hidden">
            <button
              onPointerDown={() => touchDir(-1)}
              onPointerUp={() => touchDir(0)}
              onPointerLeave={() => touchDir(0)}
              className="w-20 h-16 rounded-xl bg-gray-800 text-2xl active:bg-gray-700 select-none"
            >▲</button>
            <button
              onPointerDown={() => touchDir(1)}
              onPointerUp={() => touchDir(0)}
              onPointerLeave={() => touchDir(0)}
              className="w-20 h-16 rounded-xl bg-gray-800 text-2xl active:bg-gray-700 select-none"
            >▼</button>
          </div>
        )}

        {/* Controls hint */}
        <p className="text-xs text-gray-700 hidden sm:block">
          W / S or ↑ / ↓ to move
        </p>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-white animate-spin" />
  );
}
