
import { useCallback, useEffect, useRef, useState } from 'react';
import './NeonRacing.css';

const WIDTH = 800;
const HEIGHT = 520;
const ROAD_LEFT = 190;
const ROAD_RIGHT = 610;
const CAR_WIDTH = 42;
const CAR_HEIGHT = 72;

const TRAFFIC_COLORS = ['#ff4fd8', '#ffb454', '#a78bff', '#54eaff'];

const normalizeLanguage = (language) =>
  String(language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';

const TEXT = {
  en: {
    eyebrow: 'NEXORA AI ARCADE · GAME 05',
    title: 'NEON',
    racing: 'RACING',
    tagline: 'Own the highway. Dodge the traffic. Beat your high score.',
    yourScore: 'YOUR SCORE',
    roadSpeed: 'ROAD SPEED',
    raceStatus: 'RACE STATUS',
    ready: 'READY',
    racingStatus: 'RACING',
    pausedStatus: 'PAUSED',
    crashedStatus: 'CRASHED',
    speed: 'SPEED',
    kmh: 'KM/H',
    readyTitle: 'READY, RACER?',
    pausedTitle: 'RACE PAUSED',
    overTitle: 'RACE OVER',
    readyMessage: 'Start your engine and dodge the traffic.',
    racingMessage: 'Race in progress — avoid the other cars!',
    pausedMessage: 'Your race is paused.',
    crashedMessage: 'CRASH! Start again and try to beat your score.',
    start: 'Start Racing',
    resume: 'Resume Race',
    again: 'Race Again',
    pause: 'Pause',
    restart: 'Restart',
    or: 'or',
    steer: 'to steer',
    left: 'LEFT',
    right: 'RIGHT',
    steerLeft: 'Steer left',
    steerRight: 'Steer right',
    canvasLabel: 'Neon Racing game. Use the left and right arrow keys or A and D to steer.',
    tipTitle: 'RACING TIP:',
    tip: 'Watch the lanes ahead. Small steering movements help you avoid traffic at higher speeds.',
  },
  zh: {
    eyebrow: 'NEXORA AI 街机 · 游戏 05',
    title: '霓虹',
    racing: '赛车',
    tagline: '驰骋高速公路，躲避车流，刷新你的最高分。',
    yourScore: '你的得分',
    roadSpeed: '行驶速度',
    raceStatus: '比赛状态',
    ready: '准备就绪',
    racingStatus: '比赛中',
    pausedStatus: '已暂停',
    crashedStatus: '发生碰撞',
    speed: '速度',
    kmh: '公里/小时',
    readyTitle: '准备好了吗，车手？',
    pausedTitle: '比赛已暂停',
    overTitle: '比赛结束',
    readyMessage: '启动引擎，灵活躲避前方车辆。',
    racingMessage: '比赛正在进行——小心避开其他车辆！',
    pausedMessage: '比赛已暂停。',
    crashedMessage: '发生碰撞！重新开始，挑战你的最高分。',
    start: '开始比赛',
    resume: '继续比赛',
    again: '再次比赛',
    pause: '暂停',
    restart: '重新开始',
    or: '或',
    steer: '控制方向',
    left: '左转',
    right: '右转',
    steerLeft: '向左转向',
    steerRight: '向右转向',
    canvasLabel: '霓虹赛车游戏。使用左右方向键或 A 和 D 键控制方向。',
    tipTitle: '赛车提示：',
    tip: '留意前方车道。在高速行驶时，轻微转向可以帮助你避开其他车辆。',
  },
};

function makeTrafficCar(lane, y, color) {
  return {
    lane,
    x: ROAD_LEFT + lane * 105 + 31,
    y,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    color,
  };
}

function createRace() {
  return {
    playerX: WIDTH / 2 - CAR_WIDTH / 2,
    playerY: HEIGHT - 112,
    traffic: [
      makeTrafficCar(0, -160, TRAFFIC_COLORS[0]),
      makeTrafficCar(2, -390, TRAFFIC_COLORS[1]),
    ],
    keys: { left: false, right: false },
    roadOffset: 0,
    score: 0,
    speed: 4,
    running: false,
    lastSpawn: 0,
    lastTime: 0,
  };
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawCar(ctx, x, y, color, player = false) {
  ctx.save();

  ctx.shadowColor = color;
  ctx.shadowBlur = player ? 22 : 12;

  // Wheels.
  ctx.fillStyle = '#090a15';
  roundedRect(ctx, x - 4, y + 13, 8, 18, 3);
  ctx.fill();
  roundedRect(ctx, x + CAR_WIDTH - 4, y + 13, 8, 18, 3);
  ctx.fill();
  roundedRect(ctx, x - 4, y + 46, 8, 18, 3);
  ctx.fill();
  roundedRect(ctx, x + CAR_WIDTH - 4, y + 46, 8, 18, 3);
  ctx.fill();

  // Main body.
  const gradient = ctx.createLinearGradient(x, y, x + CAR_WIDTH, y);
  gradient.addColorStop(0, '#292044');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, '#292044');

  ctx.fillStyle = gradient;
  roundedRect(ctx, x, y, CAR_WIDTH, CAR_HEIGHT, 11);
  ctx.fill();

  // Windshield.
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#101b38';
  roundedRect(ctx, x + 6, y + 15, CAR_WIDTH - 12, 19, 5);
  ctx.fill();

  // Rear / front glass detail.
  ctx.fillStyle = '#26385c';
  roundedRect(ctx, x + 7, y + 39, CAR_WIDTH - 14, 12, 3);
  ctx.fill();

  // Headlights.
  ctx.fillStyle = player ? '#ffffff' : '#ff6dba';
  ctx.shadowColor = player ? '#54eaff' : '#ff4fd8';
  ctx.shadowBlur = 10;
  roundedRect(ctx, x + 5, y + 3, 9, 4, 2);
  ctx.fill();
  roundedRect(ctx, x + CAR_WIDTH - 14, y + 3, 9, 4, 2);
  ctx.fill();

  // Rear lights.
  ctx.fillStyle = '#ff426d';
  roundedRect(ctx, x + 5, y + CAR_HEIGHT - 7, 9, 4, 2);
  ctx.fill();
  roundedRect(ctx, x + CAR_WIDTH - 14, y + CAR_HEIGHT - 7, 9, 4, 2);
  ctx.fill();

  ctx.restore();
}

function drawRace(ctx, game, language) {
  const t = TEXT[language];

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background.
  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#080b19');
  background.addColorStop(1, '#15102c');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Futuristic city silhouettes.
  for (let i = 0; i < 15; i += 1) {
    const x = i * 55;
    const buildingHeight = 65 + ((i * 37) % 95);

    ctx.fillStyle = i % 2 === 0 ? '#10132a' : '#15132e';
    ctx.fillRect(x, HEIGHT - buildingHeight, 40, buildingHeight);

    ctx.fillStyle = 'rgba(67, 231, 255, 0.3)';
    for (let wy = HEIGHT - buildingHeight + 12; wy < HEIGHT - 10; wy += 19) {
      ctx.fillRect(x + 8, wy, 4, 7);
      ctx.fillRect(x + 23, wy, 4, 7);
    }
  }

  // Road shoulders.
  ctx.fillStyle = '#090d1c';
  ctx.fillRect(ROAD_LEFT - 24, 0, ROAD_RIGHT - ROAD_LEFT + 48, HEIGHT);

  // Road.
  const roadGradient = ctx.createLinearGradient(ROAD_LEFT, 0, ROAD_RIGHT, 0);
  roadGradient.addColorStop(0, '#15162d');
  roadGradient.addColorStop(0.5, '#20203a');
  roadGradient.addColorStop(1, '#15162d');
  ctx.fillStyle = roadGradient;
  ctx.fillRect(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, HEIGHT);

  // Neon road edges.
  ctx.save();
  ctx.shadowColor = '#35eaff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#35eaff';
  ctx.fillRect(ROAD_LEFT, 0, 3, HEIGHT);
  ctx.fillRect(ROAD_RIGHT - 3, 0, 3, HEIGHT);
  ctx.restore();

  // Road lane markers.
  ctx.save();
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([30, 23]);
  ctx.lineDashOffset = -game.roadOffset;

  for (let lane = 1; lane <= 3; lane += 1) {
    const x = ROAD_LEFT + lane * 105;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }

  ctx.restore();

  // Decorative side lights.
  for (let y = -30 + (game.roadOffset % 70); y < HEIGHT; y += 70) {
    ctx.fillStyle = '#a16bff';
    ctx.shadowColor = '#a16bff';
    ctx.shadowBlur = 9;
    ctx.fillRect(ROAD_LEFT - 16, y, 4, 20);
    ctx.fillRect(ROAD_RIGHT + 12, y, 4, 20);
  }
  ctx.shadowBlur = 0;

  // Traffic.
  for (const car of game.traffic) {
    drawCar(ctx, car.x, car.y, car.color);
  }

  // Player.
  drawCar(ctx, game.playerX, game.playerY, '#46eaff', true);

  // Speed indicator.
  ctx.fillStyle = 'rgba(7, 10, 26, 0.8)';
  roundedRect(ctx, 20, 20, 145, 51, 9);
  ctx.fill();

  ctx.fillStyle = '#9ba5ce';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(t.speed, 33, 39);

  ctx.fillStyle = '#53edff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${Math.round(game.speed * 25)} ${t.kmh}`, 33, 59);
}

export default function NeonRacing({ language = 'en' }) {
  const lang = normalizeLanguage(language);
  const t = TEXT[lang];

  const canvasRef = useRef(null);
  const gameRef = useRef(createRace());

  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('ready');

  const resetRace = useCallback(() => {
    gameRef.current = createRace();
    setScore(0);
    setStatus('ready');
  }, []);

  const startRace = useCallback(() => {
    if (status === 'crashed') {
      gameRef.current = createRace();
      setScore(0);
    }

    gameRef.current.running = true;
    setStatus('racing');
  }, [status]);

  const pauseRace = useCallback(() => {
    gameRef.current.running = false;
    setStatus((current) => current === 'racing' ? 'paused' : current);
  }, []);

  const setSteering = useCallback((direction, pressed) => {
    gameRef.current.keys[direction] = pressed;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return undefined;

    let animationFrame;
    let previousTime = 0;
    let spawnTimer = 0;

    function update(delta) {
      const game = gameRef.current;
      if (!game.running) return;

      const factor = Math.min(delta / 16.67, 2);
      game.roadOffset = (game.roadOffset + game.speed * factor) % 53;

      if (game.keys.left) game.playerX -= 6.5 * factor;
      if (game.keys.right) game.playerX += 6.5 * factor;

      game.playerX = Math.max(
        ROAD_LEFT + 10,
        Math.min(ROAD_RIGHT - CAR_WIDTH - 10, game.playerX),
      );

      game.speed = Math.min(4 + game.score / 500, 9);

      for (const car of game.traffic) {
        car.y += game.speed * factor;

        const playerHitbox = {
          left: game.playerX + 5,
          right: game.playerX + CAR_WIDTH - 5,
          top: game.playerY + 8,
          bottom: game.playerY + CAR_HEIGHT - 8,
        };

        const trafficHitbox = {
          left: car.x + 4,
          right: car.x + CAR_WIDTH - 4,
          top: car.y + 8,
          bottom: car.y + CAR_HEIGHT - 8,
        };

        const collision =
          playerHitbox.left < trafficHitbox.right &&
          playerHitbox.right > trafficHitbox.left &&
          playerHitbox.top < trafficHitbox.bottom &&
          playerHitbox.bottom > trafficHitbox.top;

        if (collision) {
          game.running = false;
          setStatus('crashed');
          return;
        }

        if (car.y > HEIGHT + CAR_HEIGHT) {
          game.score += 10;
          setScore(game.score);
          car.y = -CAR_HEIGHT - Math.random() * 200;

          const lane = Math.floor(Math.random() * 4);
          car.lane = lane;
          car.x = ROAD_LEFT + lane * 105 + 31;
          car.color = TRAFFIC_COLORS[
            Math.floor(Math.random() * TRAFFIC_COLORS.length)
          ];
        }
      }

      spawnTimer += delta;

      if (spawnTimer > Math.max(550, 1300 - game.score * 2)) {
        spawnTimer = 0;

        const lane = Math.floor(Math.random() * 4);
        const tooClose = game.traffic.some(
          (car) => car.lane === lane && car.y < 130,
        );

        if (!tooClose && game.traffic.length < 6) {
          game.traffic.push(
            makeTrafficCar(
              lane,
              -CAR_HEIGHT - 20,
              TRAFFIC_COLORS[
                Math.floor(Math.random() * TRAFFIC_COLORS.length)
              ],
            ),
          );
        }
      }
    }

    function frame(time) {
      const delta = previousTime ? time - previousTime : 16.67;
      previousTime = time;

      update(delta);
      drawRace(ctx, gameRef.current, lang);

      animationFrame = window.requestAnimationFrame(frame);
    }

    function keyDown(event) {
      const key = event.key.toLowerCase();

      if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
        event.preventDefault();
      }

      if (key === 'arrowleft' || key === 'a') {
        gameRef.current.keys.left = true;
      }

      if (key === 'arrowright' || key === 'd') {
        gameRef.current.keys.right = true;
      }
    }

    function keyUp(event) {
      const key = event.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        gameRef.current.keys.left = false;
      }

      if (key === 'arrowright' || key === 'd') {
        gameRef.current.keys.right = false;
      }
    }

    function clearKeys() {
      gameRef.current.keys.left = false;
      gameRef.current.keys.right = false;
    }

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', clearKeys);

    animationFrame = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, [lang]);

  const statusText = {
    ready: t.readyMessage,
    racing: t.racingMessage,
    paused: t.pausedMessage,
    crashed: t.crashedMessage,
  }[status];

  const statusLabel = {
    ready: t.ready,
    racing: t.racingStatus,
    paused: t.pausedStatus,
    crashed: t.crashedStatus,
  }[status];

  const overlayTitle = {
    ready: t.readyTitle,
    paused: t.pausedTitle,
    crashed: t.overTitle,
  }[status];

  return (
    <section className="neon-racing" id="neon-racing">
      <header className="racing-heading">
        <span className="racing-eyebrow">{t.eyebrow}</span>

        <h2>
          {t.title} <span>{t.racing}</span>
        </h2>

        <p>{t.tagline}</p>
      </header>

      <div className="racing-stats">
        <div>
          <span>{t.yourScore}</span>
          <strong>{score}</strong>
        </div>

        <div>
          <span>{t.roadSpeed}</span>
          <strong>{Math.round(100 + Math.min(score, 500))} {t.kmh}</strong>
        </div>

        <div>
          <span>{t.raceStatus}</span>
          <strong className={status === 'crashed' ? 'racing-danger' : ''}>
            {statusLabel}
          </strong>
        </div>
      </div>

      <div className="racing-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="racing-canvas"
          aria-label={t.canvasLabel}
        />

        {status !== 'racing' && (
          <div className="racing-overlay">
            <div className="racing-overlay-card">
              <span className="racing-overlay-icon">
                {status === 'crashed' ? '✕' : status === 'paused' ? 'Ⅱ' : '🏎'}
              </span>

              <h3>{overlayTitle}</h3>

              <p>{statusText}</p>

              <button type="button" onClick={startRace}>
                {status === 'paused'
                  ? t.resume
                  : status === 'crashed'
                    ? t.again
                    : t.start}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="racing-control-row">
        <div className="racing-help">
          <span><kbd>←</kbd> <kbd>→</kbd></span>
          <span>{t.or} <kbd>A</kbd> <kbd>D</kbd> {t.steer}</span>
        </div>

        <div className="racing-actions">
          {status === 'racing' && (
            <button
              type="button"
              className="racing-secondary"
              onClick={pauseRace}
            >
              Ⅱ {t.pause}
            </button>
          )}

          <button
            type="button"
            className="racing-secondary"
            onClick={resetRace}
          >
            ↻ {t.restart}
          </button>
        </div>
      </div>

      <div className="racing-mobile-controls">
        <button
          type="button"
          aria-label={t.steerLeft}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setSteering('left', true);
          }}
          onPointerUp={() => setSteering('left', false)}
          onPointerCancel={() => setSteering('left', false)}
          onLostPointerCapture={() => setSteering('left', false)}
        >
          ← {t.left}
        </button>

        <button
          type="button"
          aria-label={t.steerRight}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setSteering('right', true);
          }}
          onPointerUp={() => setSteering('right', false)}
          onPointerCancel={() => setSteering('right', false)}
          onLostPointerCapture={() => setSteering('right', false)}
        >
          {t.right} →
        </button>
      </div>

      <div className="racing-tip">
        <span>✦</span>
        <p>
          <strong>{t.tipTitle}</strong> {t.tip}
        </p>
      </div>
    </section>
  );
}
