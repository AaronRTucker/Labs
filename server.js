const http = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');

// ── Game constants ────────────────────────────────────────────────────────────
const W = 800, H = 500;
const PADDLE_H = 80, PADDLE_W = 12, PADDLE_MARGIN = 16;
const BALL_R = 8;
const PADDLE_SPEED = 6;
const MAX_BALL_SPEED = 14;
const WIN_SCORE = 7;
const AI_WAIT_MS = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randSign = () => (Math.random() < 0.5 ? 1 : -1);

function newBall() {
  return {
    x: W / 2, y: H / 2,
    vx: randSign() * 5,
    vy: (Math.random() * 2 + 1) * randSign(),
  };
}

// ── Room ──────────────────────────────────────────────────────────────────────
function createRoom(p1, p2) {
  const isAI = p2 === null;

  const state = {
    ball: newBall(),
    left:  { y: H / 2 - PADDLE_H / 2, dir: 0, score: 0 },
    right: { y: H / 2 - PADDLE_H / 2, dir: 0, score: 0 },
    status: 'playing',
    winner: null,
  };

  let paused = false;
  let pauseTimer = null;

  function send(ws, msg) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
  }
  function broadcast(msg) {
    send(p1, msg);
    if (!isAI) send(p2, msg);
  }

  function afterScore(loserSide) {
    paused = true;
    state.status = 'scored';
    broadcast({ type: 'state', state });
    pauseTimer = setTimeout(() => {
      state.ball = newBall();
      state.ball.vx = loserSide === 'left' ? -5 : 5;
      state.status = 'playing';
      paused = false;
    }, 1000);
  }

  function tick() {
    if (paused || state.status === 'done') return;

    if (isAI) {
      const mid = state.right.y + PADDLE_H / 2;
      const diff = state.ball.y - mid;
      state.right.dir = Math.abs(diff) < 6 ? 0 : diff > 0 ? 1 : -1;
    }

    state.left.y  = clamp(state.left.y  + state.left.dir  * PADDLE_SPEED, 0, H - PADDLE_H);
    state.right.y = clamp(state.right.y + state.right.dir * PADDLE_SPEED, 0, H - PADDLE_H);

    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    if (state.ball.y - BALL_R < 0)  { state.ball.y = BALL_R;      state.ball.vy =  Math.abs(state.ball.vy); }
    if (state.ball.y + BALL_R > H)  { state.ball.y = H - BALL_R;  state.ball.vy = -Math.abs(state.ball.vy); }

    const lEdge = PADDLE_MARGIN + PADDLE_W;
    if (state.ball.vx < 0 && state.ball.x - BALL_R <= lEdge &&
        state.ball.y + BALL_R >= state.left.y && state.ball.y - BALL_R <= state.left.y + PADDLE_H) {
      state.ball.x = lEdge + BALL_R;
      const rel = (state.ball.y - (state.left.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      state.ball.vx =  Math.abs(state.ball.vx) * 1.05;
      state.ball.vy = rel * 6;
    }

    const rEdge = W - PADDLE_MARGIN - PADDLE_W;
    if (state.ball.vx > 0 && state.ball.x + BALL_R >= rEdge &&
        state.ball.y + BALL_R >= state.right.y && state.ball.y - BALL_R <= state.right.y + PADDLE_H) {
      state.ball.x = rEdge - BALL_R;
      const rel = (state.ball.y - (state.right.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      state.ball.vx = -Math.abs(state.ball.vx) * 1.05;
      state.ball.vy = rel * 6;
    }

    const spd = Math.hypot(state.ball.vx, state.ball.vy);
    if (spd > MAX_BALL_SPEED) {
      state.ball.vx = (state.ball.vx / spd) * MAX_BALL_SPEED;
      state.ball.vy = (state.ball.vy / spd) * MAX_BALL_SPEED;
    }

    if (state.ball.x + BALL_R < 0) {
      state.right.score++;
      if (state.right.score >= WIN_SCORE) { state.status = 'done'; state.winner = 'right'; broadcast({ type: 'state', state }); return; }
      afterScore('left'); return;
    }
    if (state.ball.x - BALL_R > W) {
      state.left.score++;
      if (state.left.score >= WIN_SCORE) { state.status = 'done'; state.winner = 'left'; broadcast({ type: 'state', state }); return; }
      afterScore('right'); return;
    }

    broadcast({ type: 'state', state });
  }

  const interval = setInterval(tick, 1000 / 60);

  send(p1, { type: 'start', role: 'left',  opponent: isAI ? 'ai' : 'human' });
  if (!isAI) send(p2, { type: 'start', role: 'right', opponent: 'human' });

  return {
    handleInput(ws, dir) {
      if (ws === p1) state.left.dir  = dir;
      else           state.right.dir = dir;
    },
    handleDisconnect(ws) {
      clearInterval(interval);
      if (pauseTimer) clearTimeout(pauseTimer);
      const other = ws === p1 ? p2 : p1;
      send(other, { type: 'opponent_left' });
    },
    cleanup() {
      clearInterval(interval);
      if (pauseTimer) clearTimeout(pauseTimer);
    },
  };
}

// ── Matchmaking ───────────────────────────────────────────────────────────────
const waitingQueue = [];

function matchPlayer(ws) {
  while (waitingQueue.length > 0) {
    const opponent = waitingQueue.shift();
    if (opponent.readyState === 1) {
      const room = createRoom(opponent, ws);
      opponent._room = room;
      ws._room = room;
      return;
    }
  }
  ws.send(JSON.stringify({ type: 'waiting' }));
  waitingQueue.push(ws);
  ws._aiTimer = setTimeout(() => {
    const idx = waitingQueue.indexOf(ws);
    if (idx !== -1 && ws.readyState === 1) {
      waitingQueue.splice(idx, 1);
      const room = createRoom(ws, null);
      ws._room = room;
    }
  }, AI_WAIT_MS);
}

// ── Server ────────────────────────────────────────────────────────────────────
const dev = process.env.NODE_ENV !== 'production';

// Create the HTTP server first so we can pass it to Next.js
const server = http.createServer();

// Pass httpServer so Next.js wires up its own WebSocket handling (HMR) internally
const app = next({ dev, httpServer: server });
const handle = app.getRequestHandler();

server.on('request', (req, res) => {
  handle(req, res, parse(req.url, true));
});

app.prepare().then(() => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const pathname = parse(req.url).pathname;
    console.log('[upgrade]', pathname);
    if (pathname === '/pong-ws') {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    }
    // Next.js handles /_next/webpack-hmr internally via httpServer
  });

  wss.on('connection', (ws) => {
    console.log('[pong] client connected');
    ws._room = null;
    ws._aiTimer = null;
    matchPlayer(ws);

    ws.on('message', (raw) => {
      try {
        const { type, dir } = JSON.parse(raw);
        if (type === 'input' && ws._room) ws._room.handleInput(ws, dir);
      } catch {}
    });

    ws.on('close', () => {
      console.log('[pong] client disconnected');
      if (ws._aiTimer) clearTimeout(ws._aiTimer);
      const idx = waitingQueue.indexOf(ws);
      if (idx !== -1) waitingQueue.splice(idx, 1);
      if (ws._room) ws._room.handleDisconnect(ws);
    });
  });

  server.listen(3000, () => console.log('> Ready on http://localhost:3000'));
});
