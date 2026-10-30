
import { useCallback, useEffect, useRef, useState } from 'react';
import './BrickBreaker.css';

const WIDTH = 800;
const HEIGHT = 520;
const PADDLE_WIDTH = 112;
const PADDLE_HEIGHT = 13;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
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

function createBricks(level) {
  const bricks = [];
  const totalWidth =
    BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
  const startX = (WIDTH - totalWidth) / 2;
  const rows = Math.min(BRICK_ROWS + Math.floor((level - 1) / 2), 7);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < BRICK_COLS; col += 1) {
      bricks.push({
        x: startX + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
        alive: true,
        hits: level >= 3 && row < 2 ? 2 : 1,
        maxHits: level >= 3 && row < 2 ? 2 : 1,
      });
    }
  }

  return bricks;
}

function createGame(level = 1) {
  return {
    paddle: {
      x: WIDTH / 2 - PADDLE_WIDTH / 2,
      y: HEIGHT - 42,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 8,
    },
    ball: {
      x: WIDTH / 2,
      y: HEIGHT - 60,
      vx: 4.2 + level * 0.35,
      vy: -(5.2 + level * 0.35),
      radius: BALL_RADIUS,
      launched: false,
    },
    bricks: createBricks(level),
    keys: { left: false, right: false },
    level,
    score: 0,
    lives: 3,
    playing: false,
    lastTime: 0,
  };
}

function drawGame(ctx, game) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#0c1026');
  background.addColorStop(0.55, '#11102b');
  background.addColorStop(1, '#080d1d');

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle neon grid.
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

  // Bricks.
  for (const brick of game.bricks) {
    if (!brick.alive) continue;

    ctx.save();
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = brick.color;

    const radius = 5;
    ctx.beginPath();
    ctx.roundRect(
      brick.x,
      brick.y,
      brick.width,
      brick.height,
      radius,
    );
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.fillRect(brick.x + 5, brick.y + 3, brick.width - 10, 2);

    if (brick.hits > 1) {
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
  ctx.beginPath();
  ctx.roundRect(
    game.paddle.x,
    game.paddle.y,
    game.paddle.width,
    game.paddle.height,
    7,
  );
  ctx.fill();
  ctx.restore();

  // Ball.
  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 20;

  const ballGradient = ctx.createRadialGradient(
    game.ball.x - 3,
    game.ball.y - 3,
    1,
    game.ball.x,
    game.ball.y,
    game.ball.radius,
  );

  ballGradient.addColorStop(0, '#ffffff');
  ballGradient.addColorStop(0.5, '#73f4ff');
  ballGradient.addColorStop(1, '#6a75ff');

  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(
    game.ball.x,
    game.ball.y,
    game.ball.radius,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();

  // Floor line.
  ctx.strokeStyle = 'rgba(72, 224, 255, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT - 12);
  ctx.lineTo(WIDTH, HEIGHT - 12);
  ctx.stroke();
}

export default function BrickBreaker() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGame());
  const animationRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState('ready');

  const resetGame = useCallback(() => {
    gameRef.current = createGame(1);
    setScore(0);
    setLives(3);
    setLevel(1);
    setStatus('ready');
  }, []);

  const startGame = useCallback(() => {
    const game = gameRef.current;

    if (status === 'won' || status === 'lost') {
      gameRef.current = createGame(1);
      setScore(0);
      setLives(3);
      setLevel(1);
    }

    const current = gameRef.current;
    current.playing = true;
    current.ball.launched = true;

    setStatus('playing');
  }, [status]);

  const pauseGame = useCallback(() => {
    gameRef.current.playing = false;
    setStatus((current) => current === 'playing' ? 'paused' : current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return undefined;

    let animationFrame;

    function resetBall(game) {
      game.ball.x = game.paddle.x + game.paddle.width / 2;
      game.ball.y = game.paddle.y - game.ball.radius - 2;
      game.ball.vx = (Math.random() > 0.5 ? 1 : -1) *
        (4.2 + game.level * 0.35);
      game.ball.vy = -(5.2 + game.level * 0.35);
      game.ball.launched = false;
      game.playing = false;
    }

    function update(delta) {
      const game = gameRef.current;

      if (!game.playing) {
        if (!game.ball.launched) {
          game.ball.x = game.paddle.x + game.paddle.width / 2;
          game.ball.y = game.paddle.y - game.ball.radius - 2;
        }
        return;
      }

      const factor = Math.min(delta / 16.67, 2);

      if (game.keys.left) game.paddle.x -= game.paddle.speed * factor;
      if (game.keys.right) game.paddle.x += game.paddle.speed * factor;

      game.paddle.x = Math.max(
        0,
        Math.min(WIDTH - game.paddle.width, game.paddle.x),
      );

      game.ball.x += game.ball.vx * factor;
      game.ball.y += game.ball.vy * factor;

      const ball = game.ball;
      const paddle = game.paddle;

      // Side walls.
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
      }

      if (ball.x + ball.radius >= WIDTH) {
        ball.x = WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx);
      }

      // Ceiling.
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
      }

      // Paddle collision.
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
      }

      // Brick collisions.
      for (const brick of game.bricks) {
        if (!brick.alive) continue;

        const overlaps =
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height;

        if (!overlaps) continue;

        brick.hits -= 1;

        if (brick.hits <= 0) {
          brick.alive = false;
          game.score += 10;
          setScore(game.score);
        } else {
          game.score += 5;
          setScore(game.score);
        }

        const previousX = ball.x - ball.vx * factor;
        const previousY = ball.y - ball.vy * factor;

        if (
          previousY + ball.radius <= brick.y ||
          previousY - ball.radius >= brick.y + brick.height
        ) {
          ball.vy *= -1;
        } else {
          ball.vx *= -1;
        }

        // Handle only one brick per frame.
        break;
      }

      // Ball falls below the paddle.
      if (ball.y - ball.radius > HEIGHT) {
        game.lives -= 1;
        setLives(game.lives);

        if (game.lives <= 0) {
          game.playing = false;
          game.ball.launched = false;
          setStatus('lost');
        } else {
          resetBall(game);
          setStatus('ready');
        }

        return;
      }

      // All bricks cleared.
      if (game.bricks.every((brick) => !brick.alive)) {
        game.playing = false;

        if (game.level >= 5) {
          setStatus('won');
        } else {
          game.level += 1;
          game.bricks = createBricks(game.level);
          resetBall(game);
          setLevel(game.level);
          setStatus('ready');
        }
      }
    }

    let previousTime = 0;

    function frame(time) {
      const delta = previousTime ? time - previousTime : 16.67;
      previousTime = time;

      update(delta);
      drawGame(ctx, gameRef.current);

      animationFrame = window.requestAnimationFrame(frame);
    }

    function handleKeyDown(event) {
      const key = event.key.toLowerCase();

      if (
        ['arrowleft', 'arrowright', ' '].includes(key) ||
        key === 'a' ||
        key === 'd'
      ) {
        event.preventDefault();
      }

      if (key === 'arrowleft' || key === 'a') {
        gameRef.current.keys.left = true;
      }

      if (key === 'arrowright' || key === 'd') {
        gameRef.current.keys.right = true;
      }
    }

    function handleKeyUp(event) {
      const key = event.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        gameRef.current.keys.left = false;
      }

      if (key === 'arrowright' || key === 'd') {
        gameRef.current.keys.right = false;
      }
    }

    function handlePointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const x = (event.clientX - rect.left) * scaleX;

      gameRef.current.paddle.x = Math.max(
        0,
        Math.min(WIDTH - gameRef.current.paddle.width, x - gameRef.current.paddle.width / 2),
      );
    }

    function handlePointerDown(event) {
      handlePointerMove(event);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);

    animationFrame = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

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

      <div className="brick-game-frame">
        <canvas
          ref={canvasRef}
          className="brick-canvas"
          width={WIDTH}
          height={HEIGHT}
          aria-label="Neon Brick Breaker game. Move the paddle with the arrow keys, A and D, or your mouse."
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
              {status === 'paused' ? (
                <button type="button" onClick={startGame}>Resume Game</button>
              ) : (
                <button type="button" onClick={startGame}>
                  {status === 'ready' ? 'Start Game' : 'Play Again'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="brick-controls">
        <div className="brick-control-help">
          <span><kbd>←</kbd> <kbd>→</kbd></span>
          <span>or <kbd>A</kbd> <kbd>D</kbd> to move</span>
          <span className="brick-help-separator">·</span>
          <span>Mouse or touch also works</span>
        </div>

        <div className="brick-buttons">
          {status === 'playing' ? (
            <button type="button" className="brick-secondary" onClick={pauseGame}>
              Ⅱ Pause
            </button>
          ) : status === 'paused' ? (
            <button type="button" className="brick-primary" onClick={startGame}>
              ▶ Resume
            </button>
          ) : null}

          <button type="button" className="brick-secondary" onClick={resetGame}>
            ↻ Restart
          </button>
        </div>
      </div>

      <div className="brick-footer-tip">
        <span>✦</span>
        <p><strong>ARCADE TIP:</strong> Hit the ball with the edge of your paddle to change its angle and reach difficult bricks.</p>
      </div>
    </section>
  );
}
