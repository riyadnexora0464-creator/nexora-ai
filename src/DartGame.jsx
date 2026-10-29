
import { useCallback, useEffect, useRef, useState } from "react";
import "./DartGame.css";

const W = 960;
const H = 540;
const GROUND = 435;
const SLING = { x: 145, y: 355 };
const TOTAL_LEVELS = 50;
const SAVE_KEY = "nexora-smash-mobile-v3";

const zones = [
  { name: "Neon City", sky: ["#080b2b", "#34206d", "#f72585"], ground: "#151a49", accent: "#00f5ff" },
  { name: "Cyber Jungle", sky: ["#031c25", "#075b55", "#41e59b"], ground: "#073c39", accent: "#64ffb5" },
  { name: "Lava Planet", sky: ["#24091e", "#8b2445", "#ff7b32"], ground: "#511a35", accent: "#ffb347" },
  { name: "Ice Galaxy", sky: ["#06162e", "#174f8d", "#a2f3ff"], ground: "#16375e", accent: "#8be9ff" },
  { name: "Quantum Core", sky: ["#180b35", "#51228c", "#ff3ec9"], ground: "#28134e", accent: "#ff5eea" },
];

function makeLevel(level) {
  const zone = Math.floor((level - 1) / 10) % zones.length;
  const difficulty = (level - 1) % 10;
  const count = Math.min(2 + Math.floor(difficulty / 2), 6);
  const enemies = [];
  const blocks = [];
  const baseX = 550 + (difficulty % 3) * 12;
  const baseY = GROUND;

  for (let i = 0; i < count; i++) {
    const x = baseX + (i % 2) * 95;
    const y = baseY - 42 - Math.floor(i / 2) * 78;
    enemies.push({
      x: x + 18,
      y,
      r: level % 10 === 0 ? 23 : 17,
      alive: true,
      hp: level % 10 === 0 ? 2 : 1,
      phase: i * 1.7,
    });
  }

  const towers = Math.min(2 + Math.floor(difficulty / 3), 5);
  for (let i = 0; i < towers; i++) {
    const x = baseX - 25 + i * 62;
    blocks.push({ x, y: GROUND - 28, w: 48, h: 28, hp: 1 });
    if (difficulty > 1) {
      blocks.push({ x: x + 8, y: GROUND - 65, w: 32, h: 38, hp: 1 });
    }
    if (difficulty > 4) {
      blocks.push({ x: x - 4, y: GROUND - 93, w: 56, h: 12, hp: 1 });
    }
  }

  return {
    level,
    zone,
    enemies,
    blocks,
    birds: 3,
    shots: 0,
    wind: (level % 5 - 2) * 0.025,
    won: false,
    lost: false,
    flying: false,
    bird: { x: SLING.x, y: SLING.y, vx: 0, vy: 0, r: 15 },
    trail: [],
  };
}

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return Math.max(1, Math.min(TOTAL_LEVELS, Number(saved?.unlocked) || 1));
  } catch {
    return 1;
  }
}

export default function DartGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(makeLevel(1));
  const dragRef = useRef(false);
  const aimRef = useRef({ x: SLING.x, y: SLING.y });
  const unlockedRef = useRef(1);

  const [level, setLevel] = useState(1);
  const [unlocked, setUnlocked] = useState(1);
  const [message, setMessage] = useState("");
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const saved = readProgress();
    unlockedRef.current = saved;
    setUnlocked(saved);
    const first = Math.min(level, saved);
    gameRef.current = makeLevel(first);
    setLevel(first);
  }, []);

  const saveUnlocked = useCallback((value) => {
    const safe = Math.min(TOTAL_LEVELS, Math.max(1, value));
    unlockedRef.current = safe;
    setUnlocked(safe);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ unlocked: safe }));
    } catch {
      // The game still works if browser storage is unavailable.
    }
  }, []);

  const loadLevel = useCallback((nextLevel) => {
    const safeLevel = Math.max(1, Math.min(TOTAL_LEVELS, nextLevel));
    if (safeLevel > unlockedRef.current) return;
    gameRef.current = makeLevel(safeLevel);
    aimRef.current = { x: SLING.x, y: SLING.y };
    dragRef.current = false;
    setLevel(safeLevel);
    setMessage("");
  }, []);

  const resetLevel = useCallback(() => {
    gameRef.current = makeLevel(level);
    aimRef.current = { x: SLING.x, y: SLING.y };
    dragRef.current = false;
    setMessage("");
  }, [level]);

  const nextLevel = useCallback(() => {
    if (level >= TOTAL_LEVELS) {
      setMessage("🏆 YOU BEAT ALL 50 LEVELS!");
      return;
    }
    const next = level + 1;
    saveUnlocked(Math.max(unlockedRef.current, next));
    loadLevel(next);
  }, [level, loadLevel, saveUnlocked]);

  useEffect(() => {
    let animationId;
    let lastTime = 0;

    const draw = (timestamp) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const g = gameRef.current;
      const dt = Math.min((timestamp - (lastTime || timestamp)) / 16.67, 2);
      lastTime = timestamp;

      ctx.clearRect(0, 0, W, H);

      const theme = zones[g.zone];
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      theme.sky.forEach((color, i) => sky.addColorStop(i / (theme.sky.length - 1), color));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 65; i++) {
        const x = (i * 137.5) % W;
        const y = (i * 73.7) % 330;
        ctx.globalAlpha = 0.35 + (i % 5) * 0.12;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, y, i % 7 === 0 ? 3 : 1.5, i % 7 === 0 ? 3 : 1.5);
      }
      ctx.globalAlpha = 1;

      // Distant city silhouettes
      for (let i = 0; i < 14; i++) {
        const x = i * 76;
        const height = 65 + ((i * 31) % 100);
        ctx.fillStyle = "#070b24";
        ctx.fillRect(x, GROUND - height, 48, height);
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.5;
        for (let wy = GROUND - height + 14; wy < GROUND - 8; wy += 18) {
          ctx.fillRect(x + 9, wy, 5, 4);
          ctx.fillRect(x + 27, wy, 5, 4);
        }
        ctx.globalAlpha = 1;
      }

      // Ground
      ctx.fillStyle = theme.ground;
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = theme.accent;
      ctx.shadowBlur = 15;
      ctx.shadowColor = theme.accent;
      ctx.fillRect(0, GROUND, W, 4);
      ctx.shadowBlur = 0;

      // Wind indicator
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px system-ui";
      ctx.fillText(`WIND ${g.wind > 0 ? "→" : g.wind < 0 ? "←" : "·"} ${Math.abs(g.wind * 100).toFixed(0)}`, 22, 32);

      // Sling posts
      ctx.strokeStyle = "#101225";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(SLING.x - 9, GROUND);
      ctx.lineTo(SLING.x - 8, SLING.y - 5);
      ctx.moveTo(SLING.x + 10, GROUND);
      ctx.lineTo(SLING.x + 9, SLING.y - 5);
      ctx.stroke();

      // Blocks
      g.blocks.forEach((b) => {
        if (b.hp <= 0) return;
        const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
        grad.addColorStop(0, "#00e5ff");
        grad.addColorStop(1, "#5e42ff");
        ctx.fillStyle = grad;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#d8fbff";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      });

      // Enemies
      g.enemies.forEach((e) => {
        if (!e.alive) return;
        const bob = Math.sin(timestamp / 250 + e.phase) * 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y + bob, e.r, 0, Math.PI * 2);
        ctx.fillStyle = e.hp > 1 ? "#ff9e3d" : "#ff3c9d";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#160d30";
        ctx.beginPath();
        ctx.arc(e.x - 5, e.y + bob - 3, 2.5, 0, Math.PI * 2);
        ctx.arc(e.x + 5, e.y + bob - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        if (e.hp > 1) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 12px system-ui";
          ctx.textAlign = "center";
          ctx.fillText("BOSS", e.x, e.y + bob - e.r - 8);
          ctx.textAlign = "left";
        }
      });

      // Aiming band
      if (dragRef.current && !g.flying && !g.won && !g.lost) {
        const a = aimRef.current;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(SLING.x - 8, SLING.y);
        ctx.lineTo(a.x, a.y);
        ctx.moveTo(SLING.x + 9, SLING.y);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
        ctx.setLineDash([5, 8]);
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(SLING.x + (SLING.x - a.x) * 2.5, SLING.y + (SLING.y - a.y) * 2.5);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = "#f4e8ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(SLING.x - 8, SLING.y);
        ctx.lineTo(SLING.x + 9, SLING.y);
        ctx.stroke();
      }

      // Projectile physics
      if (g.flying) {
        const b = g.bird;
        g.trail.push({ x: b.x, y: b.y });
        if (g.trail.length > 12) g.trail.shift();

        g.trail.forEach((p, i) => {
          ctx.globalAlpha = i / g.trail.length * 0.5;
          ctx.fillStyle = theme.accent;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 + i / 5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        b.vy += 0.34 * dt;
        b.vx += g.wind * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Hit enemies
        g.enemies.forEach((e) => {
          if (!e.alive) return;
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          if (Math.hypot(dx, dy) < b.r + e.r) {
            e.hp -= 1;
            if (e.hp <= 0) e.alive = false;
            b.vx *= 0.58;
            b.vy *= -0.35;
            if (Math.abs(b.vx) < 2) b.vx = 0;
          }
        });

        // Hit blocks
        g.blocks.forEach((block) => {
          if (block.hp <= 0) return;
          if (b.x + b.r > block.x && b.x - b.r < block.x + block.w &&
              b.y + b.r > block.y && b.y - b.r < block.y + block.h) {
            block.hp = 0;
            b.vx *= -0.45;
            b.vy *= -0.35;
          }
        });

        // Draw projectile
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fcff";
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (b.y > GROUND - 5 || b.x > W + 40 || b.x < -40 || b.y > H + 40) {
          g.flying = false;
          g.birds -= 1;
          if (g.enemies.every((e) => !e.alive)) {
            g.won = true;
            setMessage("LEVEL CLEARED!");
            if (g.level < TOTAL_LEVELS) saveUnlocked(Math.max(unlockedRef.current, g.level + 1));
          } else if (g.birds <= 0) {
            g.lost = true;
            setMessage("OUT OF SHOTS!");
          } else {
            g.bird = { x: SLING.x, y: SLING.y, vx: 0, vy: 0, r: 15 };
          }
        }
      } else if (!g.won && !g.lost) {
        const birdX = dragRef.current ? aimRef.current.x : SLING.x;
        const birdY = dragRef.current ? aimRef.current.y : SLING.y;
        ctx.beginPath();
        ctx.arc(birdX, birdY, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fcff";
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Level and shot information
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px system-ui";
      ctx.fillText(`LEVEL ${g.level}`, 22, 65);
      ctx.font = "15px system-ui";
      ctx.fillText(`SHOTS LEFT: ${g.birds}`, 22, 89);

      if (g.won || g.lost) {
        ctx.fillStyle = "rgba(5, 5, 25, 0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = g.won ? theme.accent : "#ff70a9";
        ctx.font = "bold 42px system-ui";
        ctx.fillText(g.won ? (g.level === TOTAL_LEVELS ? "ALL LEVELS CLEARED!" : "LEVEL CLEARED!") : "TRY AGAIN!", W / 2, 230);
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px system-ui";
        ctx.fillText(g.won ? "Use the button below to continue" : "Retry this level to keep going", W / 2, 270);
        ctx.textAlign = "left";
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [saveUnlocked]);

  const getPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * W / rect.width,
      y: (event.clientY - rect.top) * H / rect.height,
    };
  };

  const pointerDown = (event) => {
    const g = gameRef.current;
    if (g.flying || g.won || g.lost) return;
    const p = getPoint(event);
    if (Math.hypot(p.x - SLING.x, p.y - SLING.y) < 70) {
      event.preventDefault();
      canvasRef.current.setPointerCapture?.(event.pointerId);
      dragRef.current = true;
      aimRef.current = { x: p.x, y: p.y };
    }
  };

  const pointerMove = (event) => {
    if (!dragRef.current) return;
    event.preventDefault();
    const p = getPoint(event);
    const dx = p.x - SLING.x;
    const dy = p.y - SLING.y;
    const distance = Math.hypot(dx, dy);
    const maxPull = 105;
    const scale = distance > maxPull ? maxPull / distance : 1;
    aimRef.current = { x: SLING.x + dx * scale, y: SLING.y + dy * scale };
  };

  const pointerUp = (event) => {
    if (!dragRef.current) return;
    event.preventDefault();
    dragRef.current = false;
    const g = gameRef.current;
    if (g.flying || g.won || g.lost) return;

    const a = aimRef.current;
    const dx = SLING.x - a.x;
    const dy = SLING.y - a.y;
    if (Math.hypot(dx, dy) < 12) {
      aimRef.current = { x: SLING.x, y: SLING.y };
      return;
    }

    g.bird = {
      x: a.x,
      y: a.y,
      vx: dx * 0.19,
      vy: dy * 0.19,
      r: 15,
    };
    g.flying = true;
    g.shots += 1;
    g.trail = [];
  };

  const current = gameRef.current;

  return (
    <main className="smash-game">
      <header className="smash-header">
        <div>
          <p className="smash-eyebrow">NEXORA ARCADE</p>
          <h1>NEXORA <span>SMASH</span></h1>
          <p className="smash-subtitle">Pull back. Aim true. Smash the targets.</p>
        </div>
        <div className="smash-zone">
          <span>WORLD {current.zone + 1}</span>
          <strong>{zones[current.zone].name}</strong>
        </div>
      </header>

      <section className="smash-game-panel">
        <div className="smash-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="smash-canvas"
            width={W}
            height={H}
            aria-label="Nexora Smash game. Drag the ball backwards with your finger or mouse and release to shoot."
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
          />
        </div>

        <div className="smash-instructions">
          <span>📱 Phone: drag the ball and release</span>
          <span>🖱️ Computer: click, drag and release</span>
        </div>

        {message && (
          <div className={`smash-message ${current.won ? "is-win" : "is-loss"}`} role="status">
            <strong>{message}</strong>
            {current.won && current.level < TOTAL_LEVELS && (
              <button className="smash-btn smash-primary" onClick={nextLevel}>Next level →</button>
            )}
            {current.won && current.level === TOTAL_LEVELS && (
              <button className="smash-btn smash-primary" onClick={() => loadLevel(1)}>Play again</button>
            )}
            {current.lost && (
              <button className="smash-btn smash-primary" onClick={resetLevel}>Try again ↻</button>
            )}
          </div>
        )}

        <div className="smash-controls">
          <button className="smash-btn" onClick={resetLevel}>↻ Restart</button>
          <button className="smash-btn" onClick={() => setSound((v) => !v)}>
            {sound ? "🔊 Sound on" : "🔇 Sound off"}
          </button>
          <span className="smash-progress">Level {level} / {TOTAL_LEVELS}</span>
        </div>
      </section>

      <section className="smash-level-section">
        <div className="smash-section-heading">
          <div>
            <p className="smash-eyebrow">YOUR JOURNEY</p>
            <h2>Choose a level</h2>
          </div>
          <span>{unlocked} / {TOTAL_LEVELS} unlocked</span>
        </div>

        <div className="smash-level-grid">
          {Array.from({ length: TOTAL_LEVELS }, (_, index) => {
            const n = index + 1;
            const locked = n > unlocked;
            return (
              <button
                key={n}
                className={`smash-level-btn ${n === level ? "active" : ""} ${locked ? "locked" : ""}`}
                disabled={locked}
                onClick={() => loadLevel(n)}
                aria-label={locked ? `Level ${n}, locked` : `Play level ${n}`}
                title={locked ? "Clear earlier levels to unlock" : `Play level ${n}`}
              >
                {locked ? "🔒" : n % 10 === 0 ? "★" : n}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
