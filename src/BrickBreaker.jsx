
import { useCallback, useEffect, useRef, useState } from 'react';
import './BrickBreaker.css';

const WIDTH = 800;
const HEIGHT = 520;
const PADDLE_WIDTH = 112;
const PADDLE_HEIGHT = 13;
const BALL_RADIUS = 8;
const BRICK_COLS = 9;
const BRICK_WIDTH = 72;
const BRICK_HEIGHT = 21;
const BRICK_GAP = 9;
const BRICK_TOP = 75;

const BRICK_COLORS = [
  '#ff4fd8',
  '#b36bff',
  '#7d70ff',
  '#3eafff',
  '#35e7ff',
];

const POWER_TYPES = ['wide', 'multi', 'slow', 'life'];

const ACHIEVEMENTS = [
  { id: 'first', title: 'FIRST BREAK', description: 'Break your first brick', score: 10 },
  { id: 'combo', title: 'COMBO MASTER', description: 'Reach a 5x combo', score: 0 },
  { id: 'level', title: 'LEVEL CLEAR', description: 'Clear a level', score: 0 },
  { id: 'score', title: 'NEON LEGEND', description: 'Score 500 points', score: 500 },
  { id: 'survivor', title: 'SURVIVOR', description: 'Win with all 3 lives', score: 0 },
];

function createBricks(level) {
  const bricks = [];
  const rows = Math.min(5 + Math.floor((level - 1) / 2), 7);
  const totalWidth =
    BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
  const startX = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < BRICK_COLS; col += 1) {
      const unbreakable =
        level >= 3 && row === 0 && col % 3 === 1;
      const bonus =
        level >= 2 && !unbreakable && (row + col + level) % 8 === 0;
      const hits =
        !unbreakable && level >= 3 && row < 2 ? 2 : 1;

      bricks.push({
        x: startX + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color: bonus ? '#ffe66d' : BRICK_COLORS[row % BRICK_COLORS.length],
        alive: true,
        hits,
        maxHits: hits,
        unbreakable,
        bonus,
      });
    }
  }

  return bricks;
}

function makeBall(x, y, level, direction = 1) {
  return {
    x,
    y,
    vx: direction * (4.2 + level * 0.35),
    vy: -(5.2 + level * 0.35),
    radius: BALL_RADIUS,
    active: true,
  };
}

function createGame(level = 1) {
  return {
    paddle: {
      x: WIDTH / 2 - PADDLE_WIDTH / 2,
      y: HEIGHT - 42,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 8,
      wideUntil: 0,
    },
    balls: [makeBall(WIDTH / 2, HEIGHT - 60, level)],
    bricks: createBricks(level),
    powerUps: [],
    particles: [],
    keys: { left: false, right: false },
    level,
    score: 0,
    lives: 3,
    playing: false,
    combo: 0,
    comboUntil: 0,
    nextPowerId: 1,
    lastTime: 0,
  };
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function addParticles(game, x, y, color, count = 12) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;

    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 25 + Math.random() * 20,
      maxLife: 45,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function drawGame(ctx, game, now) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#0c1026');
  background.addColorStop(0.55, '#11102b');
  background.addColorStop(1, '#080d1d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.strokeStyle = 'rgba(76, 112, 255, 0.10)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }

  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  // Bricks, including bonus and unbreakable types.
  for (const brick of game.bricks) {
    if (!brick.alive) continue;

    ctx.save();
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = brick.unbreakable ? 4 : 12;
    ctx.fillStyle = brick.unbreakable ? '#454b66' : brick.color;

    roundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 5);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(brick.x + 5, brick.y + 3, brick.width - 10, 2);

    if (brick.unbreakable) {
      ctx.fillStyle = '#d5d9ef';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◆', brick.x + brick.width / 2, brick.y + 15);
    } else if (brick.bonus) {
      ctx.fillStyle = '#181329';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', brick.x + brick.width / 2, brick.y + 15);
    } else if (brick.hits > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        String(brick.hits),
        brick.x + brick.width / 2,
        brick.y + brick.height / 2 + 4,
      );
    }

    ctx.restore();
  }

  // Falling power-ups.
  for (const power of game.powerUps) {
    ctx.save();
    ctx.shadowColor = power.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = power.color;
    ctx.beginPath();
    ctx.arc(power.x, power.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#091020';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(power.symbol, power.x, power.y + 0.5);
    ctx.restore();
  }

  // Particle explosions.
  for (const particle of game.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Paddle.
  const paddleGradient = ctx.createLinearGradient(
    game.paddle.x,
    0,
    game.paddle.x + game.paddle.width,
    0,
  );
  paddleGradient.addColorStop(0, '#43eaff');
  paddleGradient.addColorStop(0.5, '#c1a0ff');
  paddleGradient.addColorStop(1, '#f15ce8');

  ctx.save();
  ctx.shadowColor = '#56dfff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = paddleGradient;
  roundedRect(
    ctx,
    game.paddle.x,
    game.paddle.y,
    game.paddle.width,
    game.paddle.height,
    7,
  );
  ctx.fill();
  ctx.restore();

  // Ball trails and balls.
  for (const ball of game.balls) {
    if (!ball.active) continue;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#73f4ff';
    ctx.beginPath();
    ctx.arc(
      ball.x - ball.vx * 1.8,
      ball.y - ball.vy * 1.8,
      ball.radius * 0.75,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    const gradient = ctx.createRadialGradient(
      ball.x - 3,
      ball.y - 3,
      1,
      ball.x,
      ball.y,
      ball.radius,
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.5, '#73f4ff');
    gradient.addColorStop(1, '#6a75ff');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(72, 224, 255, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT - 12);
  ctx.lineTo(WIDTH, HEIGHT - 12);
  ctx.stroke();

  if (game.combo >= 2 && now < game.comboUntil) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 22px sans-serif';
    ctx.fillStyle = '#ffe66d';
    ctx.shadowColor = '#ffb52e';
    ctx.shadowBlur = 15;
    ctx.fillText(`${game.combo}x COMBO!`, WIDTH / 2, HEIGHT - 85);
    ctx.restore();
  }
}

export default function BrickBreaker() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGame());
  const animationRef = useRef(null);
  const audioRef = useRef(null);
  const mutedRef = useRef(false);
  const keysRef = useRef({ left: false, right: false });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState('ready');
  const [muted, setMuted] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('nexora-brick-high-score')) || 0;
    } catch {
      return 0;
    }
  });
  const [achievements, setAchievements] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('nexora-brick-achievements') || '[]',
      );
    } catch {
      return [];
    }
  });
  const [notice, setNotice] = useState('');
  const [activePower, setActivePower] = useState('');

  const unlock = useCallback((id) => {
    setAchievements((old) => {
      if (old.includes(id)) return old;
      const next = [...old, id];
      try {
        localStorage.setItem('nexora-brick-achievements', JSON.stringify(next));
      } catch {
        // Storage may be unavailable in private browsing.
      }
      const achievement = ACHIEVEMENTS.find((item) => item.id === id);
      if (achievement) setNotice(`🏆 ${achievement.title}`);
      return next;
    });
  }, []);

  const playSound = useCallback((frequency = 440, duration = 0.07, type = 'sine') => {
    if (mutedRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioRef.current) audioRef.current = new AudioContextClass();
      const audio = audioRef.current;
      if (audio.state === 'suspended') audio.resume();

      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(0.07, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + duration,
      );
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch {
      // Audio is optional; gameplay must continue if unavailable.
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((old) => {
      mutedRef.current = !old;
      return !old;
    });
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current = createGame(1);
    keysRef.current = { left: false, right: false };
    setScore(0);
    setLives(3);
    setLevel(1);
    setStatus('ready');
    setNotice('');
    setActivePower('');
  }, []);

  const startGame = useCallback(() => {
    if (status === 'won' || status === 'lost') {
      gameRef.current = createGame(1);
      setScore(0);
      setLives(3);
      setLevel(1);
      setActivePower('');
    }

    const game = gameRef.current;
    game.playing = true;
    playSound(600, 0.1);
    setStatus('playing');
  }, [status, playSound]);

  const pauseGame = useCallback(() => {
    gameRef.current.playing = false;
    keysRef.current = { left: false, right: false };
    setStatus((current) => current === 'playing' ? 'paused' : current);
  }, []);

  const movePaddle = useCallback((direction) => {
    keysRef.current.left = direction === 'left';
    keysRef.current.right = direction === 'right';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    let previousTime = 0;

    function resetBall(game) {
      game.balls = [
        makeBall(
          game.paddle.x + game.paddle.width / 2,
          game.paddle.y - BALL_RADIUS - 2,
          game.level,
        ),
      ];
      game.playing = false;
    }

    function applyPower(game, type) {
      const paddle = game.paddle;

      if (type === 'wide') {
        paddle.width = Math.min(180, PADDLE_WIDTH * 1.5);
        paddle.wideUntil = performance.now() + 12000;
        setActivePower('WIDE PADDLE');
        setNotice('WIDE PADDLE · 12 seconds');
      } else if (type === 'multi') {
        const source = game.balls.find((ball) => ball.active);
        if (source) {
          for (const direction of [-1, 1]) {
            game.balls.push({
              ...source,
              vx: source.vx + direction * 2.5,
              vy: source.vy,
              active: true,
            });
          }
        }
        setActivePower('MULTI-BALL');
        setNotice('MULTI-BALL ACTIVATED!');
      } else if (type === 'slow') {
        game.balls.forEach((ball) => {
          ball.vx *= 0.7;
          ball.vy *= 0.7;
        });
        setActivePower('SLOW BALL');
        setNotice('SLOW BALL ACTIVATED!');
      } else if (type === 'life' && game.lives < 5) {
        game.lives += 1;
        setLives(game.lives);
        setActivePower('EXTRA LIFE');
        setNotice('EXTRA LIFE +1');
      }

      playSound(880, 0.2, 'triangle');
    }

    function update(delta, now) {
      const game = gameRef.current;
      const factor = Math.min(delta / 16.67, 2);

      game.particles = game.particles.filter((particle) => particle.life > 0);
      for (const particle of game.particles) {
        particle.x += particle.vx * factor;
        particle.y += particle.vy * factor;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.life -= factor;
      }

      if (game.paddle.wideUntil && now > game.paddle.wideUntil) {
        game.paddle.width = PADDLE_WIDTH;
        game.paddle.wideUntil = 0;
        setActivePower('');
      }

      if (!game.playing) {
        const ball = game.balls[0];
        if (ball) {
          ball.x = game.paddle.x + game.paddle.width / 2;
          ball.y = game.paddle.y - ball.radius - 2;
        }
        return;
      }

      if (keysRef.current.left || game.keys.left) {
        game.paddle.x -= game.paddle.speed * factor;
      }
      if (keysRef.current.right || game.keys.right) {
        game.paddle.x += game.paddle.speed * factor;
      }

      game.paddle.x = Math.max(
        0,
        Math.min(WIDTH - game.paddle.width, game.paddle.x),
      );

      for (const ball of game.balls) {
        if (!ball.active) continue;

        ball.x += ball.vx * factor;
        ball.y += ball.vy * factor;

        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
          playSound(250, 0.03);
        }
        if (ball.x + ball.radius >= WIDTH) {
          ball.x = WIDTH - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          playSound(250, 0.03);
        }
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
        }

        const paddle = game.paddle;
        if (
          ball.vy > 0 &&
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.height &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.width
        ) {
          ball.y = paddle.y - ball.radius;
          const hitPosition =
            (ball.x - (paddle.x + paddle.width / 2)) /
            (paddle.width / 2);
          ball.vx = hitPosition * (6 + game.level * 0.35);
          ball.vy = -Math.max(4.5, Math.abs(ball.vy));
          playSound(360, 0.04);
        }

        for (const brick of game.bricks) {
          if (!brick.alive || brick.unbreakable) continue;

          const overlaps =
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height;

          if (!overlaps) continue;

          brick.hits -= 1;
          ball.vy *= -1;
          addParticles(game, ball.x, ball.y, brick.color, 9);

          if (brick.hits <= 0) {
            brick.alive = false;
            game.combo = now < game.comboUntil ? game.combo + 1 : 1;
            game.comboUntil = now + 1800;

            const points =
              (brick.bonus ? 30 : 10) * Math.min(game.combo, 5);
            game.score += points;
            setScore(game.score);
            playSound(brick.bonus ? 900 : 520, 0.07, 'triangle');

            if (brick.bonus || Math.random() < 0.16) {
              const type = POWER_TYPES[
                Math.floor(Math.random() * POWER_TYPES.length)
              ];
              const symbols = { wide: 'W', multi: 'M', slow: 'S', life: '+' };
              const colors = {
                wide: '#43eaff',
                multi: '#f15ce8',
                slow: '#a887ff',
                life: '#7dff9b',
              };
              game.powerUps.push({
                id: game.nextPowerId++,
                x: brick.x + brick.width / 2,
                y: brick.y + brick.height / 2,
                type,
                symbol: symbols[type],
                color: colors[type],
              });
            }

            unlock('first');
            if (game.combo >= 5) unlock('combo');
            if (game.score >= 500) unlock('score');

            if (game.score > highScore) {
              setHighScore(game.score);
              try {
                localStorage.setItem(
                  'nexora-brick-high-score',
                  String(game.score),
                );
              } catch {
                // Continue without persistent storage.
              }
            }
          } else {
            game.score += 5;
            setScore(game.score);
            playSound(420, 0.04);
          }
          break;
        }

        if (ball.y - ball.radius > HEIGHT) {
          ball.active = false;
        }
      }

      game.balls = game.balls.filter((ball) => ball.active);

      if (game.balls.length === 0) {
        game.lives -= 1;
        setLives(game.lives);
        playSound(150, 0.3, 'sawtooth');

        if (game.lives <= 0) {
          game.playing = false;
          setStatus('lost');
          return;
        }

        resetBall(game);
        setStatus('ready');
        return;
      }

      for (const power of game.powerUps) {
        power.y += 2.4 * factor;
        const paddle = game.paddle;
        if (
          power.y + 10 >= paddle.y &&
          power.y - 10 <= paddle.y + paddle.height &&
          power.x >= paddle.x &&
          power.x <= paddle.x + paddle.width
        ) {
          applyPower(game, power.type);
          power.collected = true;
        }
      }

      game.powerUps = game.powerUps.filter(
        (power) => !power.collected && power.y < HEIGHT + 20,
      );

      if (game.bricks.every((brick) => !brick.alive || brick.unbreakable)) {
        game.playing = false;

        if (game.level >= 5) {
          setStatus('won');
          if (game.lives === 3) unlock('survivor');
        } else {
          unlock('level');
          game.level += 1;
          game.bricks = createBricks(game.level);
          game.powerUps = [];
          game.paddle.width = PADDLE_WIDTH;
          game.paddle.wideUntil = 0;
          resetBall(game);
          setLevel(game.level);
          setActivePower('');
          setNotice(`LEVEL ${game.level} READY`);
          setStatus('ready');
        }
      }
    }

    function frame(time) {
      const delta = previousTime ? time - previousTime : 16.67;
      previousTime = time;
      update(delta, time);
      drawGame(ctx, gameRef.current, time);
      animationRef.current = window.requestAnimationFrame(frame);
    }

    function handleKeyDown(event) {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', ' '].includes(key) || key === 'a' || key === 'd') {
        event.preventDefault();
      }
      if (key === 'arrowleft' || key === 'a') gameRef.current.keys.left = true;
      if (key === 'arrowright' || key === 'd') gameRef.current.keys.right = true;
    }

    function handleKeyUp(event) {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') gameRef.current.keys.left = false;
      if (key === 'arrowright' || key === 'd') gameRef.current.keys.right = false;
    }

    function handlePointerMove(event) {
      if (event.pointerType === 'touch') event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (WIDTH / rect.width);
      gameRef.current.paddle.x = Math.max(
        0,
        Math.min(
          WIDTH - gameRef.current.paddle.width,
          x - gameRef.current.paddle.width / 2,
        ),
      );
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerMove);
    canvas.style.touchAction = 'none';
    animationRef.current = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(animationRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerMove);
    };
  }, [highScore, playSound, unlock]);

  const statusText = {
    ready: 'READY — press Start to launch the ball',
    playing: 'IN GAME — keep the ball in play!',
    paused: 'PAUSED — take a breath',
    won: 'MISSION COMPLETE — you cleared every level!',
    lost: 'GAME OVER — try again!',
  }[status];

  return (
    <section className="brick-breaker" id="brick-breaker">
      <div className="brick-heading">
        <span className="brick-eyebrow">NEXORA AI ARCADE · GAME 04</span>
        <h2>NEON <span>BRICK BREAKER</span></h2>
        <p>Break the wall. Catch the ball. Beat every level.</p>
      </div>

      <div className="brick-stats">
        <div className="brick-stat">
          <span>SCORE</span>
          <strong>{score}</strong>
        </div>
        <div className="brick-stat">
          <span>LIVES</span>
          <strong>{'♥ '.repeat(lives).trim() || '—'}</strong>
        </div>
        <div className="brick-stat">
          <span>LEVEL</span>
          <strong>{level} / 5</strong>
        </div>
      </div>

      <div className="brick-stats brick-extra-stats">
        <div className="brick-stat">
          <span>HIGH SCORE</span>
          <strong>{Math.max(score, highScore)}</strong>
        </div>
        <div className="brick-stat">
          <span>ACHIEVEMENTS</span>
          <strong>{achievements.length} / {ACHIEVEMENTS.length}</strong>
        </div>
        <div className="brick-stat">
          <span>POWER-UP</span>
          <strong className="brick-power-label">{activePower || 'NONE'}</strong>
        </div>
      </div>

      {notice && (
        <div className="brick-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button>
        </div>
      )}

      <div className="brick-game-frame">
        <canvas
          ref={canvasRef}
          className="brick-canvas"
          width={WIDTH}
          height={HEIGHT}
          aria-label="Neon Brick Breaker. Move the paddle with arrow keys, A and D, mouse, touch, or mobile controls."
        />

        {status !== 'playing' && (
          <div className="brick-overlay">
            <div className="brick-overlay-card">
              <span className="brick-overlay-symbol">
                {status === 'won' ? '✦' : status === 'lost' ? '✕' : status === 'paused' ? 'Ⅱ' : '▶'}
              </span>
              <h3>
                {status === 'won'
                  ? 'YOU DID IT!'
                  : status === 'lost'
                    ? 'GAME OVER'
                    : status === 'paused'
                      ? 'GAME PAUSED'
                      : 'READY, PLAYER?'}
              </h3>
              <p>{statusText}</p>
              <button type="button" onClick={startGame}>
                {status === 'paused' ? 'Resume Game' : status === 'ready' ? 'Start Game' : 'Play Again'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="brick-mobile-controls" aria-label="Mobile paddle controls">
        <button
          type="button"
          onPointerDown={() => movePaddle('left')}
          onPointerUp={() => movePaddle('')}
          onPointerLeave={() => movePaddle('')}
          onPointerCancel={() => movePaddle('')}
          aria-label="Move paddle left"
        >◀ LEFT</button>
        <button
          type="button"
          onPointerDown={() => movePaddle('right')}
          onPointerUp={() => movePaddle('')}
          onPointerLeave={() => movePaddle('')}
          onPointerCancel={() => movePaddle('')}
          aria-label="Move paddle right"
        >RIGHT ▶</button>
      </div>

      <div className="brick-controls">
        <div className="brick-control-help">
          <span><kbd>←</kbd> <kbd>→</kbd></span>
          <span>or <kbd>A</kbd> <kbd>D</kbd> to move</span>
          <span className="brick-help-separator">·</span>
          <span>Mouse or touch also works</span>
        </div>

        <div className="brick-buttons">
          <button type="button" className="brick-secondary" onClick={toggleMute}>
            {muted ? '🔇 Sound Off' : '🔊 Sound On'}
          </button>
          {status === 'playing' ? (
            <button type="button" className="brick-secondary" onClick={pauseGame}>Ⅱ Pause</button>
          ) : status === 'paused' ? (
            <button type="button" className="brick-primary" onClick={startGame}>▶ Resume</button>
          ) : null}
          <button type="button" className="brick-secondary" onClick={resetGame}>↻ Restart</button>
        </div>
      </div>

      <div className="brick-achievements">
        <h3>🏆 ACHIEVEMENTS</h3>
        <div className="brick-achievement-list">
          {ACHIEVEMENTS.map((item) => (
            <div
              className={`brick-achievement ${achievements.includes(item.id) ? 'is-unlocked' : ''}`}
              key={item.id}
            >
              <span>{achievements.includes(item.id) ? '✦' : '◇'}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="brick-footer-tip">
        <span>✦</span>
        <p>
          <strong>ARCADE TIP:</strong> Hit the ball with the edge of your paddle to change its angle.
          Collect falling power-ups. ◆ grey bricks are unbreakable; yellow + bricks award bonus points.
        </p>
      </div>
    </section>
  );
}
