import { useCallback, useEffect, useRef, useState } from 'react';
import './DartGame.css';

const WIDTH = 960;
const HEIGHT = 540;
const GROUND = 420;
const SLING = { x: 150, y: 360 };
const TOTAL_LEVELS = 50;
const SAVE_KEY = 'nexora-smash-progress-v2';

const ZONES = [
  { name: 'NEON CITY', sky: ['#05051b', '#21104a', '#061a35'], glow: '#00f5ff' },
  { name: 'FLOATING WORLD', sky: ['#03142c', '#123d66', '#200b49'], glow: '#55eaff' },
  { name: 'HAZARD ZONE', sky: ['#20051f', '#481047', '#10112e'], glow: '#ff35df' },
  { name: 'DARK FORTRESS', sky: ['#02020c', '#15132d', '#350b43'], glow: '#b44dff' },
  { name: 'BOSS DIMENSION', sky: ['#200329', '#4d0757', '#07051b'], glow: '#ff45dc' }
];

function getZone(level) {
  return Math.min(4, Math.floor((level - 1) / 10));
}

function getMode(level) {
  if (level % 10 === 0) return 'BOSS BATTLE';
  if (level >= 41) return level % 2 ? 'DARK RAID' : 'BOSS HUNT';
  if (level >= 31) return 'FORTRESS ASSAULT';
  if (level >= 21) return level % 2 ? 'WIND STORM' : 'MOVING TARGETS';
  if (level >= 11) return level % 3 === 0 ? 'MOVING TARGETS' : 'FLOATING TOWERS';
  return level % 5 === 0 ? 'WIND STORM' : 'CLASSIC SMASH';
}

function getUnlocked() {
  try {
    return Math.max(1, Math.min(TOTAL_LEVELS, Number(localStorage.getItem(SAVE_KEY)) || 1));
  } catch {
    return 1;
  }
}

function createLevel(level, score = 0) {
  const zone = getZone(level);
  const mode = getMode(level);
  const difficulty = Math.floor((level - 1) / 5);
  const blocks = [];
  const enemies = [];

  const structures = [
    [
      [570, 365, 18, 55], [588, 345, 65, 14],
      [635, 310, 18, 90], [653, 290, 65, 14],
      [700, 350, 18, 70], [718, 330, 65, 14],
      [760, 370, 18, 50]
    ],
    [
      [555, 350, 18, 70], [573, 330, 70, 14],
      [620, 300, 18, 120], [638, 280, 70, 14],
      [685, 245, 18, 175], [703, 225, 70, 14],
      [750, 300, 18, 120], [768, 280, 65, 14]
    ],
    [
      [560, 280, 18, 140], [578, 280, 65, 14],
      [625, 340, 18, 80], [643, 326, 65, 14],
      [690, 265, 18, 155], [708, 265, 65, 14],
      [755, 325, 18, 95], [773, 310, 65, 14]
    ],
    [
      [560, 275, 22, 145], [582, 275, 60, 18],
      [620, 220, 22, 200], [642, 220, 75, 18],
      [695, 275, 22, 145], [717, 275, 65, 18],
      [760, 325, 22, 95], [782, 325, 55, 18]
    ],
    [
      [565, 365, 20, 55], [585, 345, 55, 15],
      [620, 315, 20, 105], [640, 295, 70, 15],
      [690, 270, 20, 150], [710, 250, 70, 15],
      [760, 315, 20, 105], [780, 295, 60, 15]
    ]
  ];

  const base = structures[zone];
  const shift = (level % 4) * 10;
  const verticalShift = (level % 3) * 9;

  base.forEach(([x, y, w, h], index) => {
    const offsetX = index % 2 === 0 ? shift : 0;
    const offsetY = index % 2 === 1 ? verticalShift : 0;

    blocks.push({
      id: `block-${index}`,
      x: x + offsetX,
      y: Math.max(155, y - offsetY),
      w,
      h,
      hp: 1 + Math.floor(difficulty / 2),
      alive: true,
      type: index % 3 === 0 ? 'reinforced' : 'normal'
    });
  });

  if (level >= 6) {
    blocks.push({
      id: 'extra-wall',
      x: 825 - (level % 3) * 12,
      y: GROUND - 90 - (level % 4) * 12,
      w: 17,
      h: 90 + (level % 4) * 12,
      hp: 2 + Math.floor(difficulty / 3),
      alive: true,
      type: 'reinforced'
    });
  }

  if (level >= 16 && level % 2 === 0) {
    blocks.push({
      id: 'high-barrier',
      x: 670,
      y: 165 + (level % 4) * 10,
      w: 90,
      h: 14,
      hp: 2 + Math.floor(difficulty / 3),
      alive: true,
      type: 'reinforced'
    });
  }

  const boss = mode === 'BOSS BATTLE';
  const enemyCount = boss ? 1 : Math.min(1 + Math.floor(level / 4), 5);
  const positions = [
    [605, GROUND - 18],
    [690, GROUND - 18],
    [770, GROUND - 18],
    [650, GROUND - 105],
    [740, GROUND - 155]
  ];

  for (let i = 0; i < enemyCount; i++) {
    const [px, py] = positions[(i + level) % positions.length];
    const x = boss ? 690 : px + (level % 3) * 8;
    const y = boss ? GROUND - 100 : py;

    enemies.push({
      id: i,
      x,
      baseX: x,
      y,
      baseY: y,
      r: boss ? 30 + Math.floor(level / 20) * 5 : 16,
      hp: boss ? 5 + Math.floor(level / 5) : 1 + Math.floor(level / 13),
      maxHp: boss ? 5 + Math.floor(level / 5) : 1 + Math.floor(level / 13),
      alive: true,
      phase: i * 1.7 + level
    });
  }

  return {
    level,
    score,
    zone,
    mode,
    boss,
    birds: Math.max(3, 5 - Math.floor(level / 15)),
    bird: {
      x: SLING.x, y: SLING.y, vx: 0, vy: 0,
      r: 17, used: false, flying: false
    },
    blocks,
    enemies,
    particles: [],
    dragging: false,
    won: false,
    gameOver: false,
    wind: level >= 21 ? (level % 2 ? 0.045 : -0.035) : 0,
    message: 'DRAG BACK • AIM • RELEASE'
  };
}

function drawBird(ctx, bird) {
  ctx.save();
  ctx.translate(bird.x, bird.y);

  if (bird.flying) ctx.rotate(Math.atan2(bird.vy, bird.vx));

  ctx.shadowColor = '#ff35df';
  ctx.shadowBlur = 22;

  const gradient = ctx.createRadialGradient(-6, -7, 1, 0, 0, bird.r);
  gradient.addColorStop(0, '#fff3a0');
  gradient.addColorStop(0.5, '#ff537c');
  gradient.addColorStop(1, '#a51c82');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffc5fb';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -5, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#160625';
  ctx.beginPath();
  ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffe56b';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(25, 4);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
function drawEnemy(ctx, enemy, boss) {
  ctx.save();
  ctx.shadowColor = boss ? '#ff35df' : '#00ff9d';
  ctx.shadowBlur = boss ? 28 : 18;

  const gradient = ctx.createRadialGradient(
    enemy.x - 5, enemy.y - 7, 2,
    enemy.x, enemy.y, enemy.r
  );
  gradient.addColorStop(0, boss ? '#ffb5f2' : '#c4ffdb');
  gradient.addColorStop(1, boss ? '#9f1b9e' : '#00a976');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = boss ? '#ff67e9' : '#6affc7';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(enemy.x - 6, enemy.y - 5, 5, 0, Math.PI * 2);
  ctx.arc(enemy.x + 6, enemy.y - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#120724';
  ctx.beginPath();
  ctx.arc(enemy.x - 5, enemy.y - 4, 2, 0, Math.PI * 2);
  ctx.arc(enemy.x + 7, enemy.y - 4, 2, 0, Math.PI * 2);
  ctx.fill();

  if (enemy.maxHp > 1) {
    const width = enemy.r * 2;
    ctx.fillStyle = '#35152e';
    ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 12, width, 5);
    ctx.fillStyle = '#ff456c';
    ctx.fillRect(
      enemy.x - enemy.r,
      enemy.y - enemy.r - 12,
      width * (enemy.hp / enemy.maxHp),
      5
    );
  }

  ctx.restore();
}

function drawGame(ctx, game) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const theme = ZONES[game.zone];
  const sky = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  theme.sky.forEach((color, i) => sky.addColorStop(i / 2, color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Stars
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = i % 3 === 0 ? '#ff45dc' : '#5bf8ff';
    ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
    ctx.fillRect((i * 137 + 19) % WIDTH, (i * 71 + 13) % 335, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Moon / energy core
  ctx.save();
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 32;
  ctx.fillStyle = theme.glow;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(820 - game.zone * 35, 88 + game.zone * 12, 25 + game.zone * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // City skyline
  for (let i = 0; i < 19; i++) {
    const x = i * 54;
    const width = 30 + (i % 3) * 12;
    const height = 55 + ((i * 37 + game.zone * 21) % 115);
    const y = 370 - height;

    ctx.fillStyle = i % 2 ? '#130c36' : '#0b1234';
    ctx.fillRect(x, y, width, height);

    ctx.save();
    ctx.strokeStyle = i % 2 ? theme.glow : '#ff43dc';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();

    for (let wy = y + 12; wy < 355; wy += 18) {
      for (let wx = x + 7; wx < x + width - 4; wx += 12) {
        ctx.fillStyle = (wx + wy + game.zone) % 3 ? theme.glow : '#ff43dc';
        ctx.fillRect(wx, wy, 4, 6);
      }
    }
  }

  // Ground and glowing grid
  ctx.fillStyle = '#100a2e';
  ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, GROUND, WIDTH, HEIGHT - GROUND);
  ctx.clip();
  ctx.strokeStyle = theme.glow;
  ctx.globalAlpha = 0.4;

  for (let y = GROUND + 12; y < HEIGHT + 40; y += 17) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  for (let x = -WIDTH; x < WIDTH * 2; x += 50) {
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 + (x - WIDTH / 2) * 0.15, GROUND);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = theme.glow;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(WIDTH, GROUND);
  ctx.stroke();
  ctx.restore();

  // Slingshot
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ff35df';
  ctx.shadowColor = '#ff35df';
  ctx.shadowBlur = 18;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(SLING.x - 12, 430);
  ctx.lineTo(SLING.x - 8, 337);
  ctx.moveTo(SLING.x + 15, 430);
  ctx.lineTo(SLING.x + 9, 337);
  ctx.stroke();

  if (game.dragging || (!game.bird.used && !game.bird.flying)) {
    ctx.strokeStyle = '#ffc5fa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(SLING.x - 8, 337);
    ctx.lineTo(game.bird.x, game.bird.y);
    ctx.lineTo(SLING.x + 9, 337);
    ctx.stroke();
  }
  ctx.restore();

  // Destructible neon barriers
  for (const block of game.blocks) {
    if (!block.alive) continue;

    ctx.save();
    ctx.fillStyle = block.type === 'reinforced'
      ? 'rgba(255, 50, 220, .28)'
      : 'rgba(0, 245, 255, .22)';
    ctx.strokeStyle = block.type === 'reinforced' ? '#ff55e8' : theme.glow;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(block.x, block.y, block.w, block.h, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  for (const enemy of game.enemies) {
    if (enemy.alive) drawEnemy(ctx, enemy, game.boss);
  }

  if (!game.bird.used || game.bird.flying) drawBird(ctx, game.bird);

  // Aiming trajectory
  if (game.dragging) {
    const vx = (SLING.x - game.bird.x) * 0.18;
    const vy = (SLING.y - game.bird.y) * 0.18;

    for (let i = 1; i <= 12; i++) {
      const t = i * 4.5;
      ctx.save();
      ctx.fillStyle = i % 2 ? '#00f5ff' : '#ff35df';
      ctx.globalAlpha = 1 - i * 0.055;
      ctx.beginPath();
      ctx.arc(
        game.bird.x + vx * t,
        game.bird.y + vy * t + 0.11 * t * t,
        Math.max(1.5, 4 - i * 0.18),
        0, Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  // Particle effects
  for (const p of game.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Heads-up display
  ctx.save();
  ctx.fillStyle = 'rgba(8,5,30,.94)';
  ctx.strokeStyle = theme.glow;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(16, 16, 215, 42, 12);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`LEVEL ${game.level}/${TOTAL_LEVELS}`, 28, 42);
  ctx.fillStyle = '#ffe56b';
  ctx.fillText(`★ ${game.score}`, 157, 42);

  ctx.fillStyle = 'rgba(8,5,30,.94)';
  ctx.strokeStyle = '#ff45dc';
  ctx.shadowColor = '#ff45dc';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(745, 16, 199, 42, 12);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`BIRDS ${game.birds}`, 757, 42);
  ctx.fillStyle = '#65faff';
  ctx.fillText(game.mode, 817, 42);

  ctx.fillStyle = 'rgba(8,5,30,.94)';
  ctx.strokeStyle = '#ff45dc';
  ctx.beginPath();
  ctx.roundRect(250, 16, 475, 36, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffe5ff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(game.message, 487, 39, 455);

  if (game.wind) {
    ctx.fillStyle = '#00f5ff';
    ctx.fillText(`WIND ${game.wind > 0 ? '→' : '←'}`, 480, 80);
  }

  ctx.restore();

  if (game.won || game.gameOver) {
    ctx.fillStyle = 'rgba(5,3,24,.88)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = game.won ? '#00f5ff' : '#ff35df';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 35px sans-serif';

    ctx.fillText(
      game.won
        ? game.level === TOTAL_LEVELS ? 'CAMPAIGN COMPLETE!' : 'LEVEL CLEARED!'
        : 'OUT OF BIRDS!',
      WIDTH / 2, 230
    );

    ctx.shadowColor = '#ffe56b';
    ctx.fillStyle = '#ffe56b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`SCORE: ${game.score}`, WIDTH / 2, 270);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d8d3ff';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      game.won
        ? game.level === TOTAL_LEVELS ? 'You conquered all 50 levels!' : 'Next level loading...'
        : 'Restart and try again.',
      WIDTH / 2, 305
    );
    ctx.restore();
  }
}
export default function DartGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const timerRef = useRef(null);
  const completedRef = useRef(false);

  const [, render] = useState(0);
  const [unlocked, setUnlocked] = useState(getUnlocked);

  if (!gameRef.current) gameRef.current = createLevel(1);

  const refresh = useCallback(() => {
    render(value => value + 1);
  }, []);

  const startLevel = useCallback((level, score = 0) => {
    if (level < 1 || level > getUnlocked()) return;

    clearTimeout(timerRef.current);
    completedRef.current = false;
    gameRef.current = createLevel(level, score);
    refresh();
  }, [refresh]);

  const restart = useCallback(() => {
    const game = gameRef.current;
    startLevel(game.level, game.score);
  }, [startLevel]);

  const completeLevel = useCallback((level, score) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const game = gameRef.current;
    game.won = true;

    if (level >= TOTAL_LEVELS) {
      refresh();
      return;
    }

    const next = level + 1;

    try {
      localStorage.setItem(SAVE_KEY, String(Math.max(getUnlocked(), next)));
    } catch {
      // Saving progress is optional.
    }

    setUnlocked(Math.max(getUnlocked(), next));
    refresh();

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      gameRef.current = createLevel(next, score);
      completedRef.current = false;
      refresh();
    }, 1800);
  }, [refresh]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let active = true;
    let previousTime = performance.now();
    let animationId;

    function loop(now) {
      if (!active) return;

      const game = gameRef.current;
      const bird = game.bird;
      const dt = Math.min(2, Math.max(0.5, (now - previousTime) / 16.67));
      previousTime = now;

      if (!game.won && !game.gameOver) {
        // Moving enemies
        if (
          ['MOVING TARGETS', 'WIND STORM', 'BOSS HUNT'].includes(game.mode) &&
          !bird.flying
        ) {
          game.enemies.forEach(enemy => {
            if (enemy.alive) {
              enemy.x = enemy.baseX + Math.sin(now / 400 + enemy.phase) * (15 + game.level % 15);
              enemy.y = enemy.baseY + Math.cos(now / 600 + enemy.phase) * (game.level >= 21 ? 12 : 4);
            }
          });
        }

        if (bird.flying) {
          bird.vx += game.wind * dt;
          bird.vy += 0.22 * dt;
          bird.x += bird.vx * dt;
          bird.y += bird.vy * dt;

          // Block collisions
          for (const block of game.blocks) {
            if (!block.alive) continue;

            const nearX = Math.max(block.x, Math.min(bird.x, block.x + block.w));
            const nearY = Math.max(block.y, Math.min(bird.y, block.y + block.h));

            if (Math.hypot(bird.x - nearX, bird.y - nearY) < bird.r) {
              const impact = Math.abs(bird.vx) + Math.abs(bird.vy);
              block.hp -= impact > 7 ? 2 : 1;

              if (block.hp <= 0) {
                block.alive = false;
                game.score += 50;

                for (let i = 0; i < 10; i++) {
                  game.particles.push({
                    x: nearX,
                    y: nearY,
                    vx: (Math.random() - 0.5) * 7,
                    vy: -Math.random() * 6,
                    r: 2 + Math.random() * 3,
                    life: 30,
                    color: i % 2 ? '#00f5ff' : '#ff35df'
                  });
                }
              }

              bird.vx *= 0.68;
              bird.vy *= -0.42;
              break;
            }
          }

          // Enemy collisions
          for (const enemy of game.enemies) {
            if (!enemy.alive) continue;

            if (Math.hypot(bird.x - enemy.x, bird.y - enemy.y) < bird.r + enemy.r) {
              const damage = Math.max(
                1,
                Math.floor((Math.abs(bird.vx) + Math.abs(bird.vy)) / 5)
              );

              enemy.hp -= damage;

              if (enemy.hp <= 0) {
                enemy.alive = false;
                game.score += game.boss ? 800 : 500;
                game.message = game.boss ? 'BOSS DEFEATED!' : 'TARGET HIT!';

                for (let i = 0; i < 16; i++) {
                  game.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 7,
                    r: 2 + Math.random() * 4,
                    life: 30,
                    color: ['#00f5ff', '#ff35df', '#ffe56b'][i % 3]
                  });
                }
              } else {
                game.message = 'TARGET DAMAGED!';
              }

              bird.vx *= 0.72;
              bird.vy *= 0.72;
            }
          }

          // Stop a shot when it leaves the play area
          if (
            bird.y > GROUND + 40 ||
            bird.x > WIDTH + 40 ||
            bird.x < -40 ||
            bird.y < -80
          ) {
            bird.flying = false;
          }
        }

        // Resolve each shot once
        if (bird.used && !bird.flying) {
          bird.used = false;

          if (game.enemies.every(enemy => !enemy.alive)) {
            game.won = true;
            game.score += 1000 + game.birds * 100;
            game.message = 'LEVEL CLEARED!';
            completeLevel(game.level, game.score);
          } else {
            game.birds = Math.max(0, game.birds - 1);

            if (game.birds <= 0) {
              game.gameOver = true;
              game.message = 'NO BIRDS LEFT!';
              refresh();
            } else {
              game.bird = {
                x: SLING.x,
                y: SLING.y,
                vx: 0,
                vy: 0,
                r: 17,
                used: false,
                flying: false
              };
              game.message = 'DRAG BACK • AIM • RELEASE';
            }
          }
        }
      }

      // Particle animation
      game.particles = game.particles.filter(p => p.life > 0);

      for (const p of game.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.12 * dt;
        p.life -= dt;
      }

      drawGame(ctx, game);
      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(animationId);
      clearTimeout(timerRef.current);
    };
  }, [completeLevel, refresh]);

  // Convert screen coordinates into the game's original canvas coordinates.
  // This works even when the canvas is scaled down on a phone.
  function pointerPosition(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT
    };
  }

  // Start dragging the bird.
  function pointerDown(event) {
    const game = gameRef.current;
    const bird = game.bird;

    if (
      game.won ||
      game.gameOver ||
      bird.used ||
      bird.flying ||
      game.dragging
    ) {
      return;
    }

    const point = pointerPosition(event);

    // A larger grab area makes the bird easier to touch on phones.
    if (Math.hypot(point.x - bird.x, point.y - bird.y) < 55) {
      event.preventDefault();
      game.dragging = true;

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Continue if pointer capture is unavailable.
      }
    }
  }

  // Move the bird while the finger or mouse is held down.
  function pointerMove(event) {
    const game = gameRef.current;

    if (!game.dragging) return;

    event.preventDefault();

    const point = pointerPosition(event);
    const dx = point.x - SLING.x;
    const dy = point.y - SLING.y;
    const distance = Math.hypot(dx, dy);
    const scale = distance > 105 ? 105 / distance : 1;

    game.bird.x = SLING.x + dx * scale;
    game.bird.y = SLING.y + dy * scale;
    game.message = 'RELEASE TO LAUNCH!';
  }

  // Release to launch the bird.
  function pointerUp(event) {
    const game = gameRef.current;

    if (!game.dragging) return;

    game.dragging = false;
    game.bird.vx = (SLING.x - game.bird.x) * 0.18;
    game.bird.vy = (SLING.y - game.bird.y) * 0.18;
    game.bird.flying = true;
    game.bird.used = true;
    game.message = 'FLY • SMASH • SCORE!';

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The shot still works if pointer capture was already released.
    }

    refresh();
  }

  // Cancel a drag safely if the browser interrupts the touch.
  function pointerCancel(event) {
    const game = gameRef.current;

    if (!game.dragging) return;

    game.dragging = false;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture may already have been released.
    }
  }

  const game = gameRef.current;
  const theme = ZONES[game.zone];

  return (
    <section className="smash-game" style={{ '--smash-glow': theme.glow }}>
      <header className="smash-header">
        <div className="smash-brand">
          <span className="smash-logo">N</span>
          <div>
            <strong>NEXORA SMASH</strong>
            <small>50 LEVELS • 5 NEON ZONES</small>
          </div>
        </div>

        <div className="smash-stats">
          <span>Level <b>{game.level}/50</b></span>
          <span>Score <b>{game.score.toLocaleString()}</b></span>
          <span>Birds <b>{game.birds}</b></span>
        </div>
      </header>

      <div className="smash-zone">
        <span>{theme.name}</span>
        <span>{game.mode}</span>
      </div>

      <div className="smash-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="smash-canvas"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerCancel}
          aria-label="Drag the bird backward and release to launch."
        />
      </div>

      <div className="smash-help">
        <span>🖱️ Drag backward to aim</span>
        <span>🌬️ Watch the wind</span>
        <span>💥 Destroy every target</span>
      </div>

      <div className="smash-actions">
        <button onClick={restart}>↻ Restart level</button>

        {game.gameOver && (
          <button className="smash-primary" onClick={restart}>
            Try again
          </button>
        )}

        {game.won && game.level === TOTAL_LEVELS && (
          <button className="smash-primary" onClick={() => startLevel(1)}>
            Play again
          </button>
        )}
      </div>

      <details className="smash-level-menu">
        <summary>Choose a level (1–50)</summary>

        <p className="smash-unlock-status">
          🔓 Unlocked through Level {unlocked}
        </p>

        <div className="smash-level-grid">
          {Array.from({ length: TOTAL_LEVELS }, (_, index) => {
            const level = index + 1;
            const locked = level > unlocked;

            return (
              <button
                key={level}
                disabled={locked}
                className={[
                  level === game.level ? 'selected' : '',
                  locked ? 'locked' : ''
                ].join(' ')}
                onClick={() => startLevel(level, game.score)}
                title={
                  locked
                    ? `Complete Level ${level - 1} to unlock`
                    : `Play Level ${level}`
                }
              >
                {locked ? '🔒' : level}
              </button>
            );
          })}
        </div>
      </details>
    </section>
  );
}