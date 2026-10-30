import { useCallback, useEffect, useRef, useState } from "react";
import "./NeonRPG.css";

const WIDTH = 1200;
const HEIGHT = 700;
const GROUND = 520;
const GRAVITY = 1500;
const PLAYER_SPEED = 300;
const MAX_ENEMIES = 10;

const TEXT = {
  en: {
    kicker: "NEXORA AI ARCADE",
    title: "Neon Cyber Quest",
    subtitle: "Fight the machines. Earn XP. Upgrade your legend.",
    playAgain: "PLAY AGAIN",
    restart: "RESTART GAME",
    start: "START GAME",
    pause: "PAUSE",
    resume: "RESUME",
    health: "HEALTH",
    level: "LEVEL",
    experience: "EXPERIENCE",
    credits: "CREDITS",
    kills: "ROBOT KILLS",
    controls: "KEYBOARD CONTROLS",
    move: "Move",
    jump: "Jump",
    attack: "Attack",
    moveLeft: "Move left",
    moveRight: "Move right",
    enterCity: "ENTER THE CITY. DEFEAT THE MACHINES.",
    missionReady: "MISSION READY",
    eliminate: "ELIMINATE THE ROBOTS",
    levelUp: "LEVEL UP! LEVEL",
    missionFailed: "MISSION FAILED",
    paused: "GAME PAUSED",
    robotsDefeated: "ROBOTS DEFEATED",
    pressAgain: "PRESS PLAY AGAIN TO RETRY",
    canvasLabel: "Neon Cyber Quest side-view sci-fi game",
    space: "SPACE",
    moveKeys: "MOVE: A / D     JUMP: W OR SPACE     ATTACK: J",
    jumpButton: "JUMP",
    attackButton: "ATTACK",
    best: "BEST KILLS",
  },
  zh: {
    kicker: "NEXORA AI 街机",
    title: "霓虹赛博任务",
    subtitle: "击败机器，获得经验，升级成为传奇。",
    playAgain: "再次游戏",
    restart: "重新开始",
    start: "开始游戏",
    pause: "暂停",
    resume: "继续",
    health: "生命值",
    level: "等级",
    experience: "经验值",
    credits: "金币",
    kills: "击败机器人",
    controls: "键盘操作",
    move: "移动",
    jump: "跳跃",
    attack: "攻击",
    moveLeft: "向左移动",
    moveRight: "向右移动",
    enterCity: "进入城市，击败机器。",
    missionReady: "任务准备就绪",
    eliminate: "消灭机器人",
    levelUp: "升级！当前等级",
    missionFailed: "任务失败",
    paused: "游戏已暂停",
    robotsDefeated: "已击败机器人",
    pressAgain: "点击再次游戏以重新挑战",
    canvasLabel: "霓虹赛博任务科幻动作游戏",
    space: "空格键",
    moveKeys: "移动：A / D     跳跃：W 或空格     攻击：J",
    jumpButton: "跳跃",
    attackButton: "攻击",
    best: "最高击杀",
  },
};

const normalizeLanguage = (language) =>
  String(language || "en").toLowerCase().startsWith("zh") ? "zh" : "en";

function makeEnemy(x, id, level) {
  const health = 55 + level * 12;

  return {
    id,
    x,
    y: GROUND,
    width: 48,
    height: 82,
    health,
    maxHealth: health,
    speed: 65 + Math.min(level * 5, 70),
    attackTimer: Math.random() * 0.8,
    facing: -1,
    dead: false,
  };
}

function createWorld() {
  return {
    running: false,
    paused: false,
    gameOver: false,
    time: 0,
    spawnTimer: 0,
    nextEnemyId: 1,
    player: {
      x: 180,
      y: GROUND,
      vx: 0,
      vy: 0,
      width: 46,
      height: 94,
      health: 100,
      maxHealth: 100,
      facing: 1,
      onGround: true,
      attackTimer: 0,
      attackCooldown: 0,
      invincible: 0,
      flash: 0,
    },
    enemies: [],
    particles: [],
    xp: 0,
    level: 1,
    credits: 0,
    kills: 0,
    message: "MISSION_READY",
    messageTimer: 2.5,
  };
}

function drawCity(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#080b22");
  sky.addColorStop(0.55, "#17133d");
  sky.addColorStop(1, "#291342");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const moonGlow = ctx.createRadialGradient(940, 125, 5, 940, 125, 100);
  moonGlow.addColorStop(0, "rgba(92,220,255,0.25)");
  moonGlow.addColorStop(1, "rgba(92,220,255,0)");
  ctx.fillStyle = moonGlow;
  ctx.fillRect(820, 15, 240, 220);

  ctx.fillStyle = "#b8f7ff";
  ctx.beginPath();
  ctx.arc(940, 125, 34, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 65; i++) {
    const x = (i * 197 + 41) % WIDTH;
    const y = (i * 83 + 22) % 330;
    const alpha = 0.25 + (Math.sin(time * 2 + i) + 1) * 0.2;
    ctx.fillStyle = `rgba(190,225,255,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  for (let i = 0; i < 19; i++) {
    const x = i * 70 - 15;
    const buildingHeight = 130 + ((i * 47) % 170);
    const y = GROUND - buildingHeight;

    ctx.fillStyle = i % 2 ? "#10142f" : "#171237";
    ctx.fillRect(x, y, 58, buildingHeight);

    ctx.fillStyle = i % 3 === 0 ? "#8b46ff" : "#24cfff";
    ctx.globalAlpha = 0.55;

    for (let wy = y + 18; wy < GROUND - 12; wy += 24) {
      for (let wx = x + 10; wx < x + 50; wx += 19) {
        if ((Math.floor(wx + wy) + i) % 3 !== 0) {
          ctx.fillRect(wx, wy, 5, 8);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#39e9ff";
  ctx.shadowColor = "#39e9ff";
  ctx.fillText("NEXORA", 90, 235);
  ctx.fillStyle = "#ed65ff";
  ctx.shadowColor = "#ed65ff";
  ctx.fillText("CYBER ZONE", 820, 300);
  ctx.restore();

  const groundGradient = ctx.createLinearGradient(0, GROUND, 0, HEIGHT);
  groundGradient.addColorStop(0, "#151a39");
  groundGradient.addColorStop(1, "#080b18");
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, GROUND, WIDTH, HEIGHT);

  ctx.fillStyle = "#35eaff";
  ctx.shadowColor = "#35eaff";
  ctx.shadowBlur = 18;
  ctx.fillRect(0, GROUND, WIDTH, 3);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(49,201,255,0.22)";
  ctx.lineWidth = 1;

  for (let x = -WIDTH; x < WIDTH * 2; x += 80) {
    const movingX = ((x - time * 65) % 80 + 80) % 80;
    ctx.beginPath();
    ctx.moveTo(x - movingX, GROUND);
    ctx.lineTo(x - movingX + 150, HEIGHT);
    ctx.stroke();
  }

  for (let y = GROUND + 30; y < HEIGHT; y += 35) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawHero(ctx, p, time) {
  const walk =
    Math.abs(p.vx) > 5 && p.onGround ? Math.sin(time * 13) * 7 : 0;
  const facing = p.facing || 1;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(facing, 1);

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(0, 1, 37, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4a176e";
  ctx.beginPath();
  ctx.moveTo(-12, -72);
  ctx.lineTo(-30 - walk * 0.5, -63);
  ctx.lineTo(-35, -13);
  ctx.lineTo(-16, -22);
  ctx.lineTo(-6, -62);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#d84dff";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#222a4d";
  ctx.beginPath();
  ctx.moveTo(-13, -31);
  ctx.lineTo(-2, -31);
  ctx.lineTo(-5 + walk, -8);
  ctx.lineTo(-15 + walk, -4);
  ctx.lineTo(-20 + walk, -10);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(3, -31);
  ctx.lineTo(14, -31);
  ctx.lineTo(19 - walk, -10);
  ctx.lineTo(14 - walk, -4);
  ctx.lineTo(4 - walk, -7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#11182f";
  ctx.fillRect(-23 + walk, -9, 17, 8);
  ctx.fillRect(7 - walk, -9, 18, 8);
  ctx.strokeStyle = "#30eaff";
  ctx.strokeRect(-23 + walk, -9, 17, 8);
  ctx.strokeRect(7 - walk, -9, 18, 8);

  const armor = ctx.createLinearGradient(-20, -75, 20, -30);
  armor.addColorStop(0, "#4e5b8b");
  armor.addColorStop(0.55, "#222b50");
  armor.addColorStop(1, "#10182f");
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.moveTo(-13, -72);
  ctx.lineTo(12, -72);
  ctx.lineTo(20, -43);
  ctx.lineTo(11, -31);
  ctx.lineTo(-12, -31);
  ctx.lineTo(-21, -44);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#38eaff";
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = "#36f4ff";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#b8ffff";
  ctx.beginPath();
  ctx.moveTo(-2, -64);
  ctx.lineTo(7, -56);
  ctx.lineTo(-2, -45);
  ctx.lineTo(-9, -55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#323e68";
  ctx.fillRect(-21, -68, 10, 27);
  ctx.fillRect(12, -68, 10, 24);
  ctx.fillStyle = "#10172b";
  ctx.fillRect(-22, -45, 12, 7);
  ctx.fillRect(11, -47, 13, 7);

  ctx.fillStyle = "#a5b7d7";
  ctx.fillRect(-5, -81, 10, 12);

  ctx.fillStyle = "#343f65";
  ctx.beginPath();
  ctx.moveTo(-16, -84);
  ctx.lineTo(-10, -96);
  ctx.lineTo(9, -96);
  ctx.lineTo(17, -85);
  ctx.lineTo(12, -72);
  ctx.lineTo(-12, -72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#d0faff";
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = "#24f0ff";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#1de7ff";
  ctx.fillRect(-11, -87, 23, 7);
  ctx.restore();

  ctx.fillStyle = "#e45cff";
  ctx.beginPath();
  ctx.moveTo(-5, -96);
  ctx.lineTo(1, -105);
  ctx.lineTo(8, -95);
  ctx.closePath();
  ctx.fill();

  if (p.attackTimer > 0) {
    const progress = 1 - p.attackTimer / 0.24;
    const angle = -1.15 + progress * 1.8;

    ctx.save();
    ctx.translate(17, -53);
    ctx.rotate(angle);
    ctx.shadowColor = "#5cf8ff";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#c9ffff";
    ctx.fillRect(0, -3, 53, 6);
    ctx.fillStyle = "#27cfff";
    ctx.fillRect(5, -1, 43, 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#d84dff";
    ctx.fillRect(-4, -7, 9, 14);
    ctx.restore();

    ctx.strokeStyle = "rgba(75,245,255,0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(18, -50, 48, -1.1, 0.7);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnemy(ctx, enemy, time) {
  const bob = Math.sin(time * 7 + enemy.id) * 2;

  ctx.save();
  ctx.translate(enemy.x, enemy.y + bob);
  ctx.scale(enemy.facing || -1, 1);

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, 1, 31, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2a1c43";
  ctx.fillRect(-16, -28, 12, 25);
  ctx.fillRect(6, -28, 12, 25);

  ctx.fillStyle = "#ff4b8d";
  ctx.fillRect(-18, -8, 16, 6);
  ctx.fillRect(5, -8, 16, 6);

  const body = ctx.createLinearGradient(-22, -72, 23, -28);
  body.addColorStop(0, "#6e2d85");
  body.addColorStop(0.5, "#35244e");
  body.addColorStop(1, "#1b1834");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-19, -70);
  ctx.lineTo(17, -70);
  ctx.lineTo(23, -39);
  ctx.lineTo(13, -28);
  ctx.lineTo(-15, -28);
  ctx.lineTo(-23, -41);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ff4d9b";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = "#ff347e";
  ctx.shadowBlur = 13;
  ctx.fillStyle = "#ff7ab6";
  ctx.fillRect(-7, -57, 14, 13);
  ctx.restore();

  ctx.fillStyle = "#49315e";
  ctx.fillRect(-25, -66, 9, 27);
  ctx.fillRect(16, -66, 10, 25);
  ctx.fillStyle = "#ff4d9b";
  ctx.fillRect(-27, -43, 13, 5);
  ctx.fillRect(15, -44, 14, 5);

  ctx.fillStyle = "#423259";
  ctx.beginPath();
  ctx.moveTo(-17, -78);
  ctx.lineTo(-11, -91);
  ctx.lineTo(11, -91);
  ctx.lineTo(18, -79);
  ctx.lineTo(11, -68);
  ctx.lineTo(-12, -68);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#b88bff";
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = "#ff2d77";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ff2d77";
  ctx.fillRect(-11, -83, 23, 6);
  ctx.restore();

  const barWidth = 54;
  const healthRatio = Math.max(0, enemy.health / enemy.maxHealth);

  ctx.fillStyle = "#27172f";
  ctx.fillRect(-barWidth / 2, -109, barWidth, 6);
  ctx.fillStyle = "#ff367f";
  ctx.fillRect(-barWidth / 2, -109, barWidth * healthRatio, 6);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-barWidth / 2, -109, barWidth, 6);

  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function addBurst(world, x, y, color, amount = 12) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 220;
    const life = 0.3 + Math.random() * 0.6;

    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color,
      life,
      maxLife: life,
    });
  }
}

export default function NeonRPG({ language = "en" }) {
  const lang = normalizeLanguage(language);
  const t = TEXT[lang];

  const canvasRef = useRef(null);
  const worldRef = useRef(createWorld());
  const keysRef = useRef({});
  const lastTimeRef = useRef(0);
  const attackRef = useRef(null);
  const jumpRef = useRef(null);

  const [hud, setHud] = useState({
    health: 100,
    maxHealth: 100,
    xp: 0,
    level: 1,
    credits: 0,
    kills: 0,
    running: false,
    paused: false,
    gameOver: false,
    message: "MISSION_READY",
  });

  const [bestKills, setBestKills] = useState(() => {
    try {
      return Number(localStorage.getItem("nexora-rpg-best") || 0);
    } catch {
      return 0;
    }
  });

  const syncHud = useCallback(() => {
    const w = worldRef.current;

    setHud({
      health: Math.max(0, Math.ceil(w.player.health)),
      maxHealth: w.player.maxHealth,
      xp: w.xp,
      level: w.level,
      credits: w.credits,
      kills: w.kills,
      running: w.running,
      paused: w.paused,
      gameOver: w.gameOver,
      message: w.message,
    });
  }, []);

  const startGame = useCallback(() => {
    const world = createWorld();
    world.running = true;
    world.message = "ELIMINATE_ROBOTS";
    world.messageTimer = 2.5;
    world.enemies.push(makeEnemy(790, world.nextEnemyId++, world.level));
    world.enemies.push(makeEnemy(1030, world.nextEnemyId++, world.level));

    worldRef.current = world;
    keysRef.current = {};
    lastTimeRef.current = 0;
    syncHud();
  }, [syncHud]);

  const togglePause = useCallback(() => {
    const w = worldRef.current;
    if (w.gameOver || !w.running) return;

    w.paused = !w.paused;
    keysRef.current = {};
    syncHud();
  }, [syncHud]);

  const jump = useCallback(() => {
    const w = worldRef.current;
    if (!w.running || w.paused || w.gameOver) return;

    const p = w.player;
    if (p.onGround) {
      p.vy = -590;
      p.onGround = false;
      addBurst(w, p.x, GROUND - 3, "#36eaff", 5);
    }
  }, []);

  const attack = useCallback(() => {
    const w = worldRef.current;
    if (!w.running || w.paused || w.gameOver) return;

    const p = w.player;
    if (p.attackCooldown > 0) return;

    p.attackTimer = 0.24;
    p.attackCooldown = 0.38;

    let hitSomething = false;

    for (const enemy of w.enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - p.x;
      const dy = Math.abs(enemy.y - p.y);
      const inFront = dx * p.facing > -8 && Math.abs(dx) < 112;

      if (inFront && dy < 115) {
        enemy.health -= 38 + (w.level - 1) * 5;
        addBurst(w, enemy.x, enemy.y - 48, "#ff5baf", 9);
        hitSomething = true;

        if (enemy.health <= 0) {
          enemy.dead = true;
          w.kills += 1;
          w.credits += 15 + w.level * 3;
          w.xp += 25;

          addBurst(w, enemy.x, enemy.y - 42, "#43f5ff", 24);

          while (w.xp >= w.level * 100) {
            w.xp -= w.level * 100;
            w.level += 1;
            p.maxHealth += 10;
            p.health = Math.min(p.maxHealth, p.health + 25);
            w.credits += 50;
            w.message = `LEVEL_UP:${w.level}`;
            w.messageTimer = 2.5;
            addBurst(w, p.x, p.y - 50, "#f4ed75", 28);
          }
        }
      }
    }

    if (!hitSomething) {
      addBurst(w, p.x + p.facing * 40, p.y - 48, "#36eaff", 4);
    }

    syncHud();
  }, [syncHud]);

  attackRef.current = attack;
  jumpRef.current = jump;

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const gameKeys = [
        "a", "d", "w", " ", "arrowleft", "arrowright", "arrowup", "j", "k",
      ];

      if (gameKeys.includes(key)) event.preventDefault();

      if (key === "escape" || key === "p") {
        if (!event.repeat) togglePause();
        return;
      }

      keysRef.current[key] = true;

      if (!event.repeat && (key === "w" || key === " " || key === "arrowup")) {
        jumpRef.current?.();
      }

      if (!event.repeat && (key === "j" || key === "k")) {
        attackRef.current?.();
      }
    };

    const onKeyUp = (event) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    const onBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [togglePause]);

  useEffect(() => {
    let animationFrame;
    let hudTimer = 0;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    function update(dt) {
      const w = worldRef.current;
      const p = w.player;

      if (w.running && !w.paused && !w.gameOver) {
        w.time += dt;
        w.spawnTimer += dt;

        if (w.messageTimer > 0) {
          w.messageTimer -= dt;
          if (w.messageTimer <= 0) w.message = "";
        }

        const keys = keysRef.current;
        let move = 0;

        if (keys.a || keys.arrowleft) move -= 1;
        if (keys.d || keys.arrowright) move += 1;

        p.vx = move * PLAYER_SPEED;
        if (move !== 0) p.facing = move;
        p.x += p.vx * dt;
        p.x = Math.max(30, Math.min(WIDTH - 30, p.x));

        p.vy += GRAVITY * dt;
        p.y += p.vy * dt;

        if (p.y >= GROUND) {
          p.y = GROUND;
          p.vy = 0;
          p.onGround = true;
        } else {
          p.onGround = false;
        }

        p.attackTimer = Math.max(0, p.attackTimer - dt);
        p.attackCooldown = Math.max(0, p.attackCooldown - dt);
        p.invincible = Math.max(0, p.invincible - dt);
        p.flash = Math.max(0, p.flash - dt);

        const aliveEnemies = w.enemies.filter((enemy) => !enemy.dead);
        const spawnDelay = Math.max(0.65, 2.0 - w.level * 0.08);

        if (
          w.spawnTimer >= spawnDelay &&
          aliveEnemies.length < MAX_ENEMIES
        ) {
          w.spawnTimer = 0;

          const spawnSide = Math.random() < 0.5 ? -1 : 1;
          const spawnX = spawnSide < 0 ? 35 : WIDTH - 35;

          w.enemies.push(
            makeEnemy(spawnX, w.nextEnemyId++, w.level)
          );
        }

        for (const enemy of w.enemies) {
          if (enemy.dead) continue;

          const dx = p.x - enemy.x;
          enemy.facing = dx >= 0 ? 1 : -1;

          if (Math.abs(dx) > 47) {
            enemy.x += Math.sign(dx) * enemy.speed * dt;
          }

          enemy.y = GROUND;
          enemy.attackTimer -= dt;

          if (
            Math.abs(dx) < 54 &&
            Math.abs(p.y - enemy.y) < 100 &&
            enemy.attackTimer <= 0
          ) {
            enemy.attackTimer = 0.95;

            if (p.invincible <= 0) {
              p.health -= 9 + Math.floor(w.level * 0.8);
              p.invincible = 0.65;
              p.flash = 0.16;
              addBurst(w, p.x, p.y - 42, "#ff4f87", 7);

              if (p.health <= 0) {
                p.health = 0;
                w.running = false;
                w.gameOver = true;
                w.paused = false;
                w.message = "MISSION_FAILED";
                w.messageTimer = 999;

                setBestKills((previous) => {
                  const next = Math.max(previous, w.kills);

                  try {
                    localStorage.setItem("nexora-rpg-best", String(next));
                  } catch {
                    // The game still works if browser storage is unavailable.
                  }

                  return next;
                });
              }
            }
          }
        }

        // Remove defeated robots instead of keeping them in the game.
        w.enemies = w.enemies.filter((enemy) => !enemy.dead);
      }

      if (!w.paused) {
        for (const particle of w.particles) {
          particle.life -= dt;
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.vx *= 0.97;
          particle.vy += 220 * dt;
        }

        w.particles = w.particles.filter((particle) => particle.life > 0);
      }
    }

    function render() {
      const w = worldRef.current;
      const p = w.player;

      drawCity(ctx, w.time);

      const glow = ctx.createRadialGradient(
        p.x, GROUND - 40, 10, p.x, GROUND - 40, 230
      );
      glow.addColorStop(0, "rgba(29,210,255,0.08)");
      glow.addColorStop(1, "rgba(29,210,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - 230, GROUND - 270, 460, 270);

      for (const enemy of w.enemies) {
        if (!enemy.dead) drawEnemy(ctx, enemy, w.time);
      }

      if (p.flash > 0) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.filter = "brightness(2)";
        drawHero(ctx, p, w.time);
        ctx.restore();
        ctx.filter = "none";
      } else if (p.invincible > 0 && Math.floor(w.time * 18) % 2 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        drawHero(ctx, p, w.time);
        ctx.restore();
      } else {
        drawHero(ctx, p, w.time);
      }

      drawParticles(ctx, w.particles);

      if (w.message && w.messageTimer > 0) {
        let message = w.message;

        if (message === "MISSION_READY") message = t.missionReady;
        else if (message === "ELIMINATE_ROBOTS") message = t.eliminate;
        else if (message === "MISSION_FAILED") message = t.missionFailed;
        else if (message.startsWith("LEVEL_UP:")) {
          message = `${t.levelUp} ${message.split(":")[1]}`;
        }

        ctx.save();
        ctx.textAlign = "center";
        ctx.font = lang === "zh" ? "bold 25px sans-serif" : "bold 25px monospace";
        ctx.shadowColor = "#34eaff";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#d8fbff";
        ctx.fillText(message, WIDTH / 2, 85);
        ctx.restore();
      }

      if (!w.running && !w.gameOver) {
        ctx.fillStyle = "rgba(4,6,22,0.45)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.textAlign = "center";
        ctx.fillStyle = "#e6fbff";
        ctx.font = lang === "zh" ? "bold 38px sans-serif" : "bold 38px monospace";
        ctx.fillText(t.title.toUpperCase(), WIDTH / 2, 285);
        ctx.font = lang === "zh" ? "18px sans-serif" : "18px monospace";
        ctx.fillStyle = "#6fefff";
        ctx.fillText(t.enterCity, WIDTH / 2, 325);
        ctx.font = lang === "zh" ? "15px sans-serif" : "15px monospace";
        ctx.fillStyle = "#d0c7ff";
        ctx.fillText(t.moveKeys, WIDTH / 2, 365);
      }

      if (w.paused) {
        ctx.fillStyle = "rgba(6,4,20,0.72)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.textAlign = "center";
        ctx.font = lang === "zh" ? "bold 48px sans-serif" : "bold 48px monospace";
        ctx.fillStyle = "#65f3ff";
        ctx.shadowColor = "#65f3ff";
        ctx.shadowBlur = 20;
        ctx.fillText(t.paused, WIDTH / 2, HEIGHT / 2);
        ctx.shadowBlur = 0;
      }

      if (w.gameOver) {
        ctx.fillStyle = "rgba(6,4,20,0.78)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.textAlign = "center";
        ctx.font = lang === "zh" ? "bold 44px sans-serif" : "bold 44px monospace";
        ctx.fillStyle = "#ff579d";
        ctx.fillText(t.missionFailed, WIDTH / 2, 290);
        ctx.font = lang === "zh" ? "20px sans-serif" : "20px monospace";
        ctx.fillStyle = "#eafaff";
        ctx.fillText(
          `${t.robotsDefeated}: ${w.kills}   ${t.credits}: ${w.credits}`,
          WIDTH / 2,
          335
        );
        ctx.font = lang === "zh" ? "16px sans-serif" : "16px monospace";
        ctx.fillStyle = "#6fefff";
        ctx.fillText(t.pressAgain, WIDTH / 2, 375);
      }
    }

    function frame(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = timestamp;

      update(dt);
      render();

      hudTimer += dt;
      if (hudTimer >= 0.12) {
        hudTimer = 0;
        syncHud();
      }

      animationFrame = requestAnimationFrame(frame);
    }

    animationFrame = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animationFrame);
  }, [syncHud, lang, t]);

  const healthPercent = Math.max(
    0,
    Math.min(100, (hud.health / hud.maxHealth) * 100)
  );
  const xpPercent = Math.min(
    100,
    (hud.xp / (hud.level * 100)) * 100
  );

  const setMoveKey = (key, pressed) => {
    keysRef.current[key] = pressed;
  };

  return (
    <div className="neon-rpg">
      <div className="neon-rpg-header">
        <div>
          <p className="neon-rpg-kicker">{t.kicker}</p>
          <h2>{t.title}</h2>
          <p className="neon-rpg-subtitle">{t.subtitle}</p>
        </div>

        <div className="neon-rpg-header-actions">
          {hud.running && !hud.gameOver && (
            <button
              className="neon-rpg-pause"
              onClick={togglePause}
            >
              {hud.paused ? t.resume : t.pause}
            </button>
          )}

          <button className="neon-rpg-play" onClick={startGame}>
            {hud.gameOver ? t.playAgain : hud.running ? t.restart : t.start}
          </button>
        </div>
      </div>

      <div className="neon-rpg-hud">
        <div className="neon-rpg-stat">
          <span>{t.health}</span>
          <div className="neon-rpg-bar">
            <div
              className="neon-rpg-health-fill"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <strong>{hud.health} / {hud.maxHealth}</strong>
        </div>

        <div className="neon-rpg-stat">
          <span>{t.level}</span>
          <strong className="neon-rpg-stat-value">{hud.level}</strong>
        </div>

        <div className="neon-rpg-stat">
          <span>{t.experience}</span>
          <div className="neon-rpg-bar">
            <div
              className="neon-rpg-xp-fill"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <strong>{hud.xp} / {hud.level * 100} XP</strong>
        </div>

        <div className="neon-rpg-stat">
          <span>{t.credits}</span>
          <strong className="neon-rpg-stat-value">{hud.credits}</strong>
        </div>

        <div className="neon-rpg-stat">
          <span>{t.kills}</span>
          <strong className="neon-rpg-stat-value">{hud.kills}</strong>
        </div>

        <div className="neon-rpg-stat neon-rpg-best">
          <span>{t.best}</span>
          <strong className="neon-rpg-stat-value">{bestKills}</strong>
        </div>
      </div>

      <div className="neon-rpg-screen">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label={t.canvasLabel}
        />
      </div>

      <div className="neon-rpg-controls">
        <div className="neon-rpg-instructions">
          <strong>{t.controls}</strong>
          <span><kbd>A</kbd> <kbd>D</kbd> {t.move}</span>
          <span><kbd>W</kbd> / <kbd>{t.space}</kbd> {t.jump}</span>
          <span><kbd>J</kbd> {t.attack}</span>
          <span><kbd>P</kbd> {t.pause}</span>
        </div>

        <div className="neon-rpg-touch-controls">
          <div className="neon-rpg-direction-buttons">
            <button
              aria-label={t.moveLeft}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                setMoveKey("a", true);
              }}
              onPointerUp={() => setMoveKey("a", false)}
              onPointerCancel={() => setMoveKey("a", false)}
              onLostPointerCapture={() => setMoveKey("a", false)}
            >
              ◀
            </button>

            <button
              aria-label={t.moveRight}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                setMoveKey("d", true);
              }}
              onPointerUp={() => setMoveKey("d", false)}
              onPointerCancel={() => setMoveKey("d", false)}
              onLostPointerCapture={() => setMoveKey("d", false)}
            >
              ▶
            </button>
          </div>

          <button
            className="neon-rpg-action"
            onPointerDown={(event) => {
              event.preventDefault();
              jumpRef.current?.();
            }}
          >
            {t.jumpButton}
          </button>

          <button
            className="neon-rpg-action neon-rpg-attack"
            onPointerDown={(event) => {
              event.preventDefault();
              attackRef.current?.();
            }}
          >
            {t.attackButton}
          </button>
        </div>
      </div>
    </div>
  );
}