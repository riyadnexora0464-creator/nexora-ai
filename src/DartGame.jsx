
import { useCallback, useEffect, useRef, useState } from 'react';
import './DartGame.css';

const MAX_LEVEL = 20;
const ARROWS_PER_LEVEL = 25;
const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 440;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function getLevelType(level) {
  if (level % 5 === 0) return 'BOSS';
  const types = ['STANDARD', 'MOVING TARGET', 'PRECISION', 'POWER SHOT'];
  return types[(level - 1) % types.length];
}

function makeTarget(level) {
  const boss = level % 5 === 0;
  const type = getLevelType(level);

  return {
    x: boss ? 700 : 650 + Math.random() * 120,
    y: 130 + Math.random() * 180,
    radius: boss ? 68 : Math.max(28, 53 - Math.floor(level / 3) * 3),
    moving: boss || type === 'MOVING TARGET' || level >= 8,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: 0.8 + level * 0.12,
    boss,
  };
}

function makeInitialGame() {
  return {
    level: 1,
    arrows: ARROWS_PER_LEVEL,
    score: 0,
    perfectShots: 0,
    powerShots: 3,
    target: makeTarget(1),
    shots: [],
    message: 'Aim carefully and hit the glowing target!',
    phase: 'ready',
    powerActive: false,
  };
}

export default function DartGame() {
  const [game, setGame] = useState(makeInitialGame);
  const [aim, setAim] = useState({ x: 650, y: 220 });
  const [soundOn, setSoundOn] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(localStorage.getItem('nexora-archery-best') || 0);
    } catch {
      return 0;
    }
  });

  const boardRef = useRef(null);
  const gameRef = useRef(game);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const playTone = useCallback((frequency = 520, duration = 0.08) => {
    if (!soundOn) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gain.gain.value = 0.045;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration
      );
      oscillator.stop(context.currentTime + duration);
      oscillator.onended = () => context.close();
    } catch {
      // The game still works if browser audio is unavailable.
    }
  }, [soundOn]);

  useEffect(() => {
    let frameId;

    const animate = (time) => {
      if (time - lastTimeRef.current > 24) {
        lastTimeRef.current = time;

        setGame((current) => {
          if (current.phase !== 'playing' || !current.target.moving) {
            return current;
          }

          const target = { ...current.target };
          target.x += target.direction * target.speed;

          if (target.x > 815) {
            target.x = 815;
            target.direction = -1;
          } else if (target.x < 565) {
            target.x = 565;
            target.direction = 1;
          }

          if (target.boss) {
            target.y = 220 + Math.sin(time / 350) * 75;
          } else if (getLevelType(current.level) === 'MOVING TARGET') {
            target.y = 220 + Math.sin(time / 420) * 95;
          }

          return { ...current, target };
        });
      }

      frameId = requestAnimationFrame(animate);
      animationRef.current = frameId;
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const resetGame = () => {
    setGame(makeInitialGame());
    setAim({ x: 650, y: 220 });
  };

  const getBoardPoint = (event) => {
    const board = boardRef.current;
    if (!board) return { x: 650, y: 220 };

    const rect = board.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * BOARD_WIDTH, 0, BOARD_WIDTH),
      y: clamp(((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT, 0, BOARD_HEIGHT),
    };
  };

  const handleAim = (event) => {
    setAim(getBoardPoint(event));
  };

  const shoot = (event) => {
    if (event) {
      event.preventDefault();
      setAim(getBoardPoint(event));
    }

    const current = gameRef.current;
    if (current.phase !== 'playing' || current.arrows <= 0) return;

    const point = event ? getBoardPoint(event) : aim;
    const target = current.target;
    const distance = Math.hypot(point.x - target.x, point.y - target.y);
    const effectiveDistance = current.powerActive ? distance * 0.65 : distance;
    const hitRadius = target.radius;

    let points = 0;
    let result = 'MISS!';
    let perfect = false;

    if (effectiveDistance <= hitRadius * 0.22) {
      points = target.boss ? 500 : 250;
      result = 'PERFECT SHOT! +' + points;
      perfect = true;
    } else if (effectiveDistance <= hitRadius * 0.48) {
      points = target.boss ? 250 : 150;
      result = 'GREAT SHOT! +' + points;
    } else if (effectiveDistance <= hitRadius * 0.75) {
      points = target.boss ? 120 : 75;
      result = 'NICE SHOT! +' + points;
    } else if (effectiveDistance <= hitRadius) {
      points = target.boss ? 60 : 30;
      result = 'TARGET HIT! +' + points;
    }

    if (current.powerActive && points > 0) {
      points += 50;
      result += ' · POWER +50';
    }

    const nextArrows = current.arrows - 1;
    const nextScore = current.score + points;
    const nextPerfect = current.perfectShots + (perfect ? 1 : 0);
    const nextTarget = makeTarget(current.level);

    const nextShots = [
      ...current.shots,
      {
        id: `${Date.now()}-${Math.random()}`,
        x: point.x,
        y: point.y,
        hit: points > 0,
      },
    ].slice(-12);

    let nextPhase = 'playing';
    let message = result;

    if (nextArrows === 0) {
      if (current.level === MAX_LEVEL) {
        nextPhase = 'won';
        message = 'YOU COMPLETED ALL 20 LEVELS!';
      } else if (points > 0 || current.score > 0) {
        nextPhase = 'level-complete';
        message = `LEVEL ${current.level} COMPLETE!`;
      } else {
        nextPhase = 'game-over';
        message = 'OUT OF ARROWS! TRY AGAIN.';
      }
    }

    setGame({
      ...current,
      arrows: nextArrows,
      score: nextScore,
      perfectShots: nextPerfect,
      shots: nextShots,
      target: nextArrows === 0 || points === 0 ? target : nextTarget,
      phase: nextPhase,
      message,
      powerActive: false,
    });

    if (nextScore > bestScore) {
      setBestScore(nextScore);
      try {
        localStorage.setItem('nexora-archery-best', String(nextScore));
      } catch {
        // Local score saving may be unavailable in private browsing.
      }
    }

    playTone(points > 0 ? (perfect ? 880 : 620) : 180);
  };

  const startLevel = (level) => {
    setGame((current) => ({
      ...current,
      level,
      arrows: ARROWS_PER_LEVEL,
      target: makeTarget(level),
      shots: [],
      phase: 'playing',
      message: level % 5 === 0
        ? `BOSS LEVEL ${level}! Hit the moving boss target!`
        : `LEVEL ${level} — ${getLevelType(level)}!`,
      powerActive: false,
    }));
    setAim({ x: 650, y: 220 });
  };

  const activatePower = () => {
    setGame((current) => {
      if (current.phase !== 'playing' || current.powerShots <= 0 || current.powerActive) {
        return current;
      }
      return {
        ...current,
        powerShots: current.powerShots - 1,
        powerActive: true,
        message: 'POWER ARROW READY! Aim and shoot!',
      };
    });
  };

  const target = game.target;
  const bowX = 95;
  const bowY = 220;
  const aimAngle = Math.atan2(aim.y - bowY, aim.x - bowX);
  const arrowLength = 72;
  const arrowStartX = bowX + Math.cos(aimAngle) * 20;
  const arrowStartY = bowY + Math.sin(aimAngle) * 20;
  const arrowEndX = arrowStartX + Math.cos(aimAngle) * arrowLength;
  const arrowEndY = arrowStartY + Math.sin(aimAngle) * arrowLength;
  const levelType = getLevelType(game.level);

  return (
    <div className="archery-game">
      <div className="archery-heading">
        <div>
          <p className="archery-eyebrow">NEXORA ARCADE</p>
          <h2>NEON <span>ARCHERY</span></h2>
          <p className="archery-subtitle">
            Focus your aim. Master all 20 levels.
          </p>
        </div>
        <button
          className={`archery-sound ${soundOn ? 'is-on' : ''}`}
          onClick={() => setSoundOn((value) => !value)}
          type="button"
        >
          {soundOn ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
      </div>

      <div className="archery-stats">
        <div className="archery-stat">
          <span>LEVEL</span>
          <strong>{game.level}<small> / {MAX_LEVEL}</small></strong>
        </div>
        <div className="archery-stat">
          <span>ARROWS LEFT</span>
          <strong>{game.arrows}<small> / {ARROWS_PER_LEVEL}</small></strong>
        </div>
        <div className="archery-stat">
          <span>SCORE</span>
          <strong>{game.score.toLocaleString()}</strong>
        </div>
        <div className="archery-stat">
          <span>PERFECT SHOTS</span>
          <strong>{game.perfectShots}</strong>
        </div>
        <div className="archery-stat">
          <span>BEST SCORE</span>
          <strong>{bestScore.toLocaleString()}</strong>
        </div>
      </div>

      <div className="archery-progress" aria-label="Level progress">
        {Array.from({ length: MAX_LEVEL }, (_, index) => (
          <span
            key={index}
            className={
              index + 1 < game.level
                ? 'completed'
                : index + 1 === game.level
                  ? 'current'
                  : ''
            }
            title={`Level ${index + 1}`}
          />
        ))}
      </div>

      <div className="archery-level-info">
        <span className={target.boss ? 'boss-tag' : 'level-tag'}>
          {target.boss ? '⚠ BOSS LEVEL' : levelType}
        </span>
        <span>Hit the centre for a perfect-shot bonus.</span>
      </div>

      <div
        className="archery-board"
        ref={boardRef}
        onPointerMove={handleAim}
        onPointerDown={(event) => {
          if (event.button === 0 && game.phase === 'playing') shoot(event);
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <svg
          className="archery-svg"
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
          role="img"
          aria-label="Neon archery target. Move your pointer and click to shoot."
        >
          <defs>
            <pattern id="archery-grid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="#3d4380" strokeWidth="0.7" />
            </pattern>
            <radialGradient id="target-glow">
              <stop offset="0%" stopColor="#fffc9c" />
              <stop offset="45%" stopColor="#ff42d0" />
              <stop offset="100%" stopColor="#6328ff" />
            </radialGradient>
            <filter id="neon-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="#080b20" />
          <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#archery-grid)" />

          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M ${i * 150} 440 L ${i * 150 + 130} 300`}
              stroke="#28285a"
              strokeWidth="1"
              opacity="0.6"
            />
          ))}

          <path
            d={`M ${bowX} ${bowY - 80} Q ${bowX + 60} ${bowY} ${bowX} ${bowY + 80}`}
            fill="none"
            stroke="#58e9ff"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#neon-glow)"
          />
          <path
            d={`M ${bowX} ${bowY - 80} L ${bowX} ${bowY + 80}`}
            stroke="#e8faff"
            strokeWidth="1.5"
          />

          <line
            x1={bowX}
            y1={bowY}
            x2={aim.x}
            y2={aim.y}
            stroke="#6ceeff"
            strokeWidth="1"
            strokeDasharray="5 7"
            opacity="0.35"
          />
          <line
            x1={arrowStartX}
            y1={arrowStartY}
            x2={arrowEndX}
            y2={arrowEndY}
            stroke={game.powerActive ? '#ffe46c' : '#b4faff'}
            strokeWidth={game.powerActive ? '5' : '3'}
            strokeLinecap="round"
            filter="url(#neon-glow)"
          />
          <path
            d={`M ${arrowEndX} ${arrowEndY} l ${-Math.cos(aimAngle - 0.5) * 13} ${-Math.sin(aimAngle - 0.5) * 13} l ${Math.cos(aimAngle) * 10} ${Math.sin(aimAngle) * 10} l ${-Math.cos(aimAngle + 0.5) * 13} ${-Math.sin(aimAngle + 0.5) * 13}`}
            fill="none"
            stroke="#d7ffff"
            strokeWidth="2"
          />

          <g transform={`translate(${target.x} ${target.y})`} filter="url(#neon-glow)">
            {target.boss && (
              <circle r={target.radius + 13} fill="none" stroke="#ff3baf" strokeWidth="3" strokeDasharray="8 7" />
            )}
            <circle r={target.radius} fill="#20204c" stroke="#67f6ff" strokeWidth="3" />
            <circle r={target.radius * 0.78} fill="#38216f" stroke="#c15aff" strokeWidth="3" />
            <circle r={target.radius * 0.55} fill="#a72eae" stroke="#ff78df" strokeWidth="3" />
            <circle r={target.radius * 0.32} fill="#ff5dbf" stroke="#ffe6ff" strokeWidth="2" />
            <circle r={target.radius * 0.13} fill="#fff5a4" stroke="#ffffff" strokeWidth="2" />
            <circle r={target.radius + 4} fill="none" stroke="#66f4ff" strokeWidth="1" opacity="0.7" />
          </g>

          {game.shots.map((shot) => (
            <g key={shot.id} transform={`translate(${shot.x} ${shot.y})`}>
              <circle r="8" fill={shot.hit ? '#65fff2' : '#ff6dba'} opacity="0.9" />
              <circle r="15" fill="none" stroke={shot.hit ? '#65fff2' : '#ff6dba'} opacity="0.6" />
            </g>
          ))}

          <g transform={`translate(${aim.x} ${aim.y})`} pointerEvents="none">
            <circle r="11" fill="none" stroke="#9bfffa" strokeWidth="1.5" />
            <path d="M -19 0 H -6 M 6 0 H 19 M 0 -19 V -6 M 0 6 V 19" stroke="#9bfffa" strokeWidth="1.5" />
          </g>
        </svg>

        {game.phase !== 'playing' && (
          <div className="archery-overlay">
            <div className="archery-result-card">
              <span className="archery-result-icon">
                {game.phase === 'won' ? '🏆' : game.phase === 'level-complete' ? '⚡' : '🏹'}
              </span>
              <h3>
                {game.phase === 'won'
                  ? 'CHAMPION!'
                  : game.phase === 'level-complete'
                    ? 'LEVEL CLEARED!'
                    : game.phase === 'game-over'
                      ? 'GAME OVER'
                      : 'READY, ARCHER?'}
              </h3>
              <p>{game.message}</p>
              <strong>{game.score.toLocaleString()} POINTS</strong>
              {game.phase === 'level-complete' ? (
                <button onClick={() => startLevel(game.level + 1)} type="button">
                  NEXT LEVEL →
                </button>
              ) : game.phase === 'won' || game.phase === 'game-over' ? (
                <button onClick={resetGame} type="button">PLAY AGAIN ↻</button>
              ) : (
                <button onClick={() => startLevel(game.level)} type="button">
                  START LEVEL →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="archery-controls">
        <div className="archery-tip">
          <span>✦</span>
          <div>
            <strong>{game.powerActive ? 'POWER ARROW ACTIVE' : 'ARCHER TIP'}</strong>
            <p>
              {game.powerActive
                ? 'Your next shot has a larger effective hit area and bonus points.'
                : 'Move your mouse or finger over the target area, then click or tap to shoot.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={`archery-power-button ${game.powerActive ? 'active' : ''}`}
          onClick={activatePower}
          disabled={game.phase !== 'playing' || game.powerShots <= 0 || game.powerActive}
        >
          ⚡ POWER ARROW <span>×{game.powerShots}</span>
        </button>
      </div>

      <div className="archery-footer">
        <span>🎯 Bullseye = perfect-shot bonus</span>
        <span>👑 Every 5th level is a boss fight</span>
        <button type="button" onClick={resetGame}>Restart Game ↻</button>
      </div>
    </div>
  );
}
