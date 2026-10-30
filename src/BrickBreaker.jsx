
import { useCallback, useEffect, useRef, useState } from 'react';
import './BrickBreaker.css';

const W = 800;
const H = 520;
const SAVE_KEY = 'nexora-brick-breaker-v3';

const TEXT = {
  en: {
    title: 'NEON BRICK BREAKER',
    subtitle: 'Break the wall. Catch the ball. Beat every level.',
    score: 'SCORE', lives: 'LIVES', level: 'LEVEL', high: 'HIGH SCORE',
    start: 'Start Game', resume: 'Resume Game', pause: 'Ⅱ Pause',
    restart: '↻ Restart', ready: 'READY — press Start to launch',
    playing: 'IN GAME — keep the ball in play!',
    paused: 'GAME PAUSED', won: 'MISSION COMPLETE!',
    lost: 'GAME OVER', next: 'NEXT LEVEL',
    tip: 'ARCADE TIP: Hit the ball with the edge of your paddle to change its angle.',
    controls: 'Use ← → or A / D, mouse, or touch to move.',
    power: 'ACTIVE POWER', achievements: 'ACHIEVEMENTS',
    unlocked: 'Unlocked', locked: 'Not unlocked yet',
    first: 'First Break', firstDesc: 'Break your first brick.',
    combo: 'Combo Master', comboDesc: 'Reach a 5-hit combo.',
    survivor: 'Survivor', survivorDesc: 'Complete a level with at least 2 lives.',
    collector: 'Power Collector', collectorDesc: 'Collect a power-up.',
    mute: 'Sound', on: 'ON', off: 'OFF',
    mobileLeft: '◀ LEFT', mobileRight: 'RIGHT ▶',
    notice: 'Power-up collected!',
    bonus: 'BONUS BRICK', solid: 'UNBREAKABLE',
    levelComplete: 'Level cleared! Get ready for the next level.',
    final: 'You conquered all five levels!',
    playAgain: 'Play Again',
    powers: {
      wide: 'Wide paddle', multi: 'Multi-ball',
      slow: 'Slow ball', life: 'Extra life'
    }
  },
  zh: {
    title: '霓虹打砖块',
    subtitle: '击碎砖墙，接住弹球，挑战所有关卡。',
    score: '分数', lives: '生命', level: '关卡', high: '最高分',
    start: '开始游戏', resume: '继续游戏', pause: 'Ⅱ 暂停',
    restart: '↻ 重新开始', ready: '准备好了？点击开始发球',
    playing: '游戏进行中 — 接住弹球！',
    paused: '游戏已暂停', won: '任务完成！',
    lost: '游戏结束', next: '下一关',
    tip: '游戏技巧：使用挡板边缘击球，可以改变弹球方向。',
    controls: '使用 ← →、A / D、鼠标或触屏移动。',
    power: '当前道具', achievements: '成就',
    unlocked: '已解锁', locked: '尚未解锁',
    first: '首次击碎', firstDesc: '击碎第一个砖块。',
    combo: '连击大师', comboDesc: '达到五次连续击中。',
    survivor: '生存者', survivorDesc: '至少保留两条生命完成一关。',
    collector: '道具收藏家', collectorDesc: '收集一个道具。',
    mute: '声音', on: '开启', off: '关闭',
    mobileLeft: '◀ 左移', mobileRight: '右移 ▶',
    notice: '获得道具！',
    bonus: '奖励砖块', solid: '不可破坏',
    levelComplete: '关卡完成！准备挑战下一关。',
    final: '你已经征服全部五个关卡！',
    playAgain: '再玩一次',
    powers: {
      wide: '加宽挡板', multi: '多重弹球',
      slow: '减速弹球', life: '额外生命'
    }
  }
};

function getLanguage(language) {
  return language === 'zh' || language === 'zh-CN' ? 'zh' : 'en';
}

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveData(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Saving is optional if browser storage is unavailable.
  }
}

function makeBricks(level) {
  const bricks = [];
  const cols = 9;
  const rows = Math.min(5 + Math.floor((level - 1) / 2), 7);
  const bw = 72;
  const bh = 21;
  const gap = 9;
  const startX = (W - (cols * bw + (cols - 1) * gap)) / 2;
  const colors = ['#ff4fd8', '#b36bff', '#7d70ff', '#3eafff', '#35e7ff'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const unbreakable = level >= 3 && (r + c + level) % 13 === 0;
      const bonus = !unbreakable && (r * cols + c + level) % 17 === 0;
      const hits = level >= 3 && r < 2 ? 2 : 1;

      bricks.push({
        x: startX + c * (bw + gap),
        y: 72 + r * (bh + gap),
        w: bw,
        h: bh,
        color: unbreakable ? '#858b9d' : bonus ? '#ffe66d' : colors[r % colors.length],
        alive: true,
        hits,
        maxHits: hits,
        unbreakable,
        bonus
      });
    }
  }

  return bricks;
}

function makeBall(x, y, vx, vy) {
  return { x, y, vx, vy, r: 8 };
}

function makeGame(level = 1, score = 0, lives = 3) {
  const paddle = {
    x: W / 2 - 56,
    y: H - 42,
    w: 112,
    h: 13,
    baseW: 112,
    speed: 8
  };

  return {
    paddle,
    balls: [makeBall(W / 2, paddle.y - 10, 4.2 + level * 0.3, -(5.2 + level * 0.3))],
    bricks: makeBricks(level),
    particles: [],
    drops: [],
    keys: { left: false, right: false },
    level,
    score,
    lives,
    playing: false,
    combo: 0,
    highScore: 0,
    activePower: '',
    powerTimer: 0,
    notice: '',
    noticeTimer: 0
  };
}

function sound(ref, muted, frequency = 440) {
  if (muted) return;

  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;

    const ctx = ref.current || (ref.current = new Audio());
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio is optional.
  }
}

function particle(game, x, y, color) {
  for (let i = 0; i < 7; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 28,
      color
    });
  }
}

function drawGame(ctx, game) {
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0c1026');
  bg.addColorStop(0.55, '#11102b');
  bg.addColorStop(1, '#080d1d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(76,112,255,.10)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  for (const brick of game.bricks) {
    if (!brick.alive) continue;

    ctx.save();
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = brick.unbreakable ? 3 : 12;
    ctx.fillStyle = brick.color;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 5);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(brick.x + 5, brick.y + 3, brick.w - 10, 2);

    if (brick.unbreakable) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SOLID', brick.x + brick.w / 2, brick.y + 14);
    } else if (brick.bonus) {
      ctx.fillStyle = '#382b00';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', brick.x + brick.w / 2, brick.y + 16);
    } else if (brick.hits > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(brick.hits), brick.x + brick.w / 2, brick.y + 15);
    }
    ctx.restore();
  }

  for (const drop of game.drops) {
    ctx.save();
    ctx.shadowColor = drop.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = drop.color;
    ctx.beginPath();
    ctx.roundRect(drop.x - 10, drop.y - 10, 20, 20, 5);
    ctx.fill();
    ctx.fillStyle = '#10152d';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(drop.symbol, drop.x, drop.y + 4);
    ctx.restore();
  }

  const pg = ctx.createLinearGradient(game.paddle.x, 0, game.paddle.x + game.paddle.w, 0);
  pg.addColorStop(0, '#43eaff');
  pg.addColorStop(0.5, '#c1a0ff');
  pg.addColorStop(1, '#f15ce8');

  ctx.save();
  ctx.shadowColor = '#56dfff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.roundRect(game.paddle.x, game.paddle.y, game.paddle.w, game.paddle.h, 7);
  ctx.fill();
  ctx.restore();

  for (const ball of game.balls) {
    const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, ball.r);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.5, '#73f4ff');
    gradient.addColorStop(1, '#6a75ff');

    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const p of game.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 28);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(72,224,255,.35)';
  ctx.fillRect(0, H - 12, W, 1);
}

export default function BrickBreaker({ language = 'en' }) {
  const lang = getLanguage(language);
  const t = TEXT[lang];

  const canvasRef = useRef(null);
  const gameRef = useRef(makeGame());
  const audioRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });
  const mutedRef = useRef(false);
  const [status, setStatus] = useState('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => Number(loadSaved().highScore) || 0);
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState('');
  const [power, setPower] = useState('');
  const [achievements, setAchievements] = useState(() => loadSaved().achievements || {});
  const [mobileKeys, setMobileKeys] = useState({ left: false, right: false });

  mutedRef.current = muted;

  const award = useCallback((name) => {
    setAchievements(old => {
      if (old[name]) return old;
      const next = { ...old, [name]: true };
      saveData({ highScore: Math.max(highScore, gameRef.current.score), achievements: next });
      return next;
    });
  }, [highScore]);

  const resetGame = useCallback(() => {
    gameRef.current = makeGame();
    gameRef.current.highScore = highScore;
    setScore(0);
    setLives(3);
    setLevel(1);
    setPower('');
    setNotice('');
    setStatus('ready');
  }, [highScore]);

  const startGame = useCallback(() => {
    if (status === 'won' || status === 'lost') {
      gameRef.current = makeGame();
      setScore(0);
      setLives(3);
      setLevel(1);
    }
    gameRef.current.playing = true;
    setStatus('playing');
  }, [status]);

  const pauseGame = useCallback(() => {
    gameRef.current.playing = false;
    setStatus('paused');
  }, []);

  const movePaddle = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const game = gameRef.current;
    game.paddle.x = Math.max(0, Math.min(W - game.paddle.w, x - game.paddle.w / 2));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frameId;
    let previous = 0;

    function applyPower(game, type) {
      const colors = { wide: '#43eaff', multi: '#ff4fd8', slow: '#ffe66d', life: '#65ff9a' };
      const symbols = { wide: 'W', multi: 'M', slow: 'S', life: '+' };

      if (type === 'wide') {
        game.paddle.w = 165;
        game.activePower = 'wide';
        game.powerTimer = 600;
      } else if (type === 'multi') {
        const source = game.balls[0];
        game.balls.push(
          makeBall(source.x, source.y, -source.vx, source.vy),
          makeBall(source.x, source.y, source.vx * 0.7, -source.vy)
        );
      } else if (type === 'slow') {
        game.balls.forEach(ball => {
          ball.vx *= 0.72;
          ball.vy *= 0.72;
        });
        game.activePower = 'slow';
        game.powerTimer = 480;
      } else if (type === 'life') {
        game.lives = Math.min(5, game.lives + 1);
        setLives(game.lives);
      }

      game.notice = type;
      setNotice(type);
      setPower(type);
      award('collector');
      sound(audioRef, mutedRef.current, 700);
      return { color: colors[type], symbol: symbols[type] };
    }

    function update(delta) {
      const game = gameRef.current;
      if (!game.playing) return;

      const factor = Math.min(delta / 16.67, 2);
      const keys = keysRef.current;

      if (keys.left) game.paddle.x -= game.paddle.speed * factor;
      if (keys.right) game.paddle.x += game.paddle.speed * factor;
      game.paddle.x = Math.max(0, Math.min(W - game.paddle.w, game.paddle.x));

      if (game.powerTimer > 0) {
        game.powerTimer -= factor;
        if (game.powerTimer <= 0) {
          game.paddle.w = game.paddle.baseW;
          game.activePower = '';
          setPower('');
        }
      }

      if (game.noticeTimer > 0) {
        game.noticeTimer -= factor;
        if (game.noticeTimer <= 0) {
          game.notice = '';
          setNotice('');
        }
      }

      for (const ball of game.balls) {
        const oldX = ball.x;
        const oldY = ball.y;

        ball.x += ball.vx * factor;
        ball.y += ball.vy * factor;

        if (ball.x - ball.r < 0) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x + ball.r > W) {
          ball.x = W - ball.r;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y - ball.r < 0) {
          ball.y = ball.r;
          ball.vy = Math.abs(ball.vy);
        }

        const paddle = game.paddle;
        if (
          ball.vy > 0 &&
          ball.y + ball.r >= paddle.y &&
          ball.y - ball.r <= paddle.y + paddle.h &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.w
        ) {
          ball.y = paddle.y - ball.r;
          const offset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          ball.vx = offset * (6 + game.level * 0.3);
          ball.vy = -Math.max(4.5, Math.abs(ball.vy));
          game.combo = 0;
          sound(audioRef, mutedRef.current, 520);
        }

        for (const brick of game.bricks) {
          if (!brick.alive) continue;

          const overlaps =
            ball.x + ball.r > brick.x &&
            ball.x - ball.r < brick.x + brick.w &&
            ball.y + ball.r > brick.y &&
            ball.y - ball.r < brick.y + brick.h;

          if (!overlaps) continue;

          // Unbreakable bricks bounce the ball but never lose health.
          if (brick.unbreakable) {
            const fromTop = oldY + ball.r <= brick.y;
            const fromBottom = oldY - ball.r >= brick.y + brick.h;
            if (fromTop || fromBottom) ball.vy *= -1;
            else ball.vx *= -1;
            ball.x = oldX;
            ball.y = oldY;
            sound(audioRef, mutedRef.current, 250);
            break;
          }

          brick.hits -= 1;
          game.combo += 1;
          const points = brick.bonus ? 50 : brick.hits <= 0 ? 10 : 5;
          game.score += points + Math.min(game.combo, 10) * 2;
          setScore(game.score);

          if (game.combo >= 5) award('combo');
          award('first');

          if (brick.hits <= 0) {
            brick.alive = false;
            particle(game, brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);

            if (brick.bonus) {
              const types = ['wide', 'multi', 'slow', 'life'];
              const type = types[Math.floor(Math.random() * types.length)];
              game.drops.push({
                x: brick.x + brick.w / 2,
                y: brick.y + brick.h / 2,
                type,
                color: ({ wide: '#43eaff', multi: '#ff4fd8', slow: '#ffe66d', life: '#65ff9a' })[type],
                symbol: ({ wide: 'W', multi: 'M', slow: 'S', life: '+' })[type]
              });
            }
          }

          const fromTop = oldY + ball.r <= brick.y;
          const fromBottom = oldY - ball.r >= brick.y + brick.h;
          if (fromTop || fromBottom) ball.vy *= -1;
          else ball.vx *= -1;

          sound(audioRef, mutedRef.current, 360 + Math.random() * 300);
          break;
        }
      }

      game.balls = game.balls.filter(ball => ball.y - ball.r <= H + 10);

      for (const drop of game.drops) {
        drop.y += 3.2 * factor;
        const p = game.paddle;
        if (
          drop.y + 10 >= p.y &&
          drop.y - 10 <= p.y + p.h &&
          drop.x >= p.x &&
          drop.x <= p.x + p.w
        ) {
          applyPower(game, drop.type);
          drop.collected = true;
        }
      }
      game.drops = game.drops.filter(drop => !drop.collected && drop.y < H + 20);

      if (game.balls.length === 0) {
        game.lives -= 1;
        setLives(game.lives);
        game.combo = 0;

        if (game.lives <= 0) {
          game.playing = false;
          setStatus('lost');
          return;
        }

        game.balls = [makeBall(
          game.paddle.x + game.paddle.w / 2,
          game.paddle.y - 12,
          4.5,
          -5.5
        )];
        game.playing = false;
        setStatus('ready');
      }

      if (game.bricks.every(brick => !brick.alive || brick.unbreakable)) {
        game.playing = false;
        if (game.level >= 5) {
          setStatus('won');
          award('survivor');
        } else {
          if (game.lives >= 2) award('survivor');
          game.level += 1;
          game.bricks = makeBricks(game.level);
          game.drops = [];
          game.balls = [makeBall(
            game.paddle.x + game.paddle.w / 2,
            game.paddle.y - 12,
            4.5 + game.level * 0.3,
            -(5.5 + game.level * 0.3)
          )];
          game.paddle.w = game.paddle.baseW;
          setLevel(game.level);
          setStatus('ready');
        }
      }

      game.particles = game.particles.filter(p => p.life > 0);
      for (const p of game.particles) {
        p.x += p.vx * factor;
        p.y += p.vy * factor;
        p.life -= factor;
      }

      const best = Math.max(highScore, game.score);
      if (best > highScore) {
        setHighScore(best);
        saveData({ highScore: best, achievements });
      }
    }

    function frame(time) {
      const delta = previous || 16.67 ? time - (previous || time - 16.67) : 16.67;
      previous = time;
      update(delta);
      drawGame(ctx, gameRef.current);
      frameId = requestAnimationFrame(frame);
    }

    function keyDown(event) {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) event.preventDefault();
      if (key === 'arrowleft' || key === 'a') keysRef.current.left = true;
      if (key === 'arrowright' || key === 'd') keysRef.current.right = true;
    }

    function keyUp(event) {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') keysRef.current.left = false;
      if (key === 'arrowright' || key === 'd') keysRef.current.right = false;
    }

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, [achievements, award, highScore]);

  useEffect(() => {
    const game = gameRef.current;
    game.highScore = highScore;
  }, [highScore]);

  const powerName = power ? t.powers[power] : '';

  return (
    <section className="brick-breaker" id="brick-breaker">
      <header className="brick-heading">
        <span className="brick-eyebrow">NEXORA AI ARCADE · GAME 04</span>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </header>

      <div className="brick-stats">
        <div className="brick-stat"><span>{t.score}</span><strong>{score}</strong></div>
        <div className="brick-stat"><span>{t.lives}</span><strong>{'♥ '.repeat(lives).trim() || '—'}</strong></div>
        <div className="brick-stat"><span>{t.level}</span><strong>{level} / 5</strong></div>
        <div className="brick-stat brick-extra-stats"><span>{t.high}</span><strong>{highScore}</strong></div>
      </div>

      {notice && (
        <div className="brick-notice">
          ✦ {t.notice} {t.powers[notice]}
          <button type="button" onClick={() => setNotice('')} aria-label="Close">×</button>
        </div>
      )}

      {powerName && (
        <p className="brick-power-label">{t.power}: {powerName}</p>
      )}

      <div className="brick-game-frame">
        <canvas
          ref={canvasRef}
          className="brick-canvas"
          width={W}
          height={H}
          onPointerMove={movePaddle}
          onPointerDown={movePaddle}
          aria-label="Neon Brick Breaker game"
        />

        {status !== 'playing' && (
          <div className="brick-overlay">
            <div className="brick-overlay-card">
              <span className="brick-overlay-symbol">
                {status === 'won' ? '✦' : status === 'lost' ? '✕' : status === 'paused' ? 'Ⅱ' : '▶'}
              </span>
              <h3>{status === 'won' ? t.won : status === 'lost' ? t.lost : status === 'paused' ? t.paused : t.ready}</h3>
              <p>{status === 'won' ? t.final : status === 'ready' ? t.controls : ''}</p>
              <button type="button" onClick={startGame}>
                {status === 'paused' ? t.resume : status === 'ready' ? t.start : t.playAgain}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="brick-controls">
        <p className="brick-control-help">{t.controls}</p>
        <div className="brick-buttons">
          {status === 'playing' && (
            <button type="button" className="brick-secondary" onClick={pauseGame}>{t.pause}</button>
          )}
          <button type="button" className="brick-secondary" onClick={resetGame}>{t.restart}</button>
          <button type="button" className="brick-secondary" onClick={() => setMuted(value => !value)}>
            {t.mute}: {muted ? t.off : t.on}
          </button>
        </div>
      </div>

      <div className="brick-mobile-controls">
        <button
          type="button"
          onPointerDown={() => { keysRef.current.left = true; }}
          onPointerUp={() => { keysRef.current.left = false; }}
          onPointerLeave={() => { keysRef.current.left = false; }}
          onPointerCancel={() => { keysRef.current.left = false; }}
        >{t.mobileLeft}</button>
        <button
          type="button"
          onPointerDown={() => { keysRef.current.right = true; }}
          onPointerUp={() => { keysRef.current.right = false; }}
          onPointerLeave={() => { keysRef.current.right = false; }}
          onPointerCancel={() => { keysRef.current.right = false; }}
        >{t.mobileRight}</button>
      </div>

      <div className="brick-footer-tip">
        <span>✦</span><p>{t.tip}</p>
      </div>

      <section className="brick-achievements">
        <h3>{t.achievements}</h3>
        <div className="brick-achievement-list">
          {[
            ['first', '🏆', t.first, t.firstDesc],
            ['combo', '⚡', t.combo, t.comboDesc],
            ['survivor', '🛡️', t.survivor, t.survivorDesc],
            ['collector', '💎', t.collector, t.collectorDesc]
          ].map(([id, icon, title, desc]) => (
            <article key={id} className={`brick-achievement ${achievements[id] ? 'is-unlocked' : ''}`}>
              <span>{icon}</span>
              <div><strong>{title}</strong><p>{achievements[id] ? t.unlocked : t.locked}</p><p>{desc}</p></div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
