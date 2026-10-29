
import { useCallback, useEffect, useRef, useState } from "react";
import "./NeonGame.css";

const GAME_TIME = 60;
const TARGET_COUNT = 5;

function makeTargets() {
  return Array.from({ length: TARGET_COUNT }, (_, id) => ({
    id,
    x: 12 + Math.random() * 76,
    y: 15 + Math.random() * 70,
    size: 34 + Math.random() * 12,
    dx: (Math.random() * 0.16 + 0.04) * (Math.random() > 0.5 ? 1 : -1),
    dy: (Math.random() * 0.12 + 0.03) * (Math.random() > 0.5 ? 1 : -1),
  }));
}

export default function NeonGame() {
  const [targets, setTargets] = useState(makeTargets);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sound, setSound] = useState(false);
  const arenaRef = useRef(null);

  const startGame = useCallback(() => {
    setTargets(makeTargets());
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(GAME_TIME);
    setFinished(false);
    setPlaying(true);
    arenaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          setPlaying(false);
          setFinished(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const movement = window.setInterval(() => {
      setTargets((previous) =>
        previous.map((target) => {
          let x = target.x + target.dx;
          let y = target.y + target.dy;
          let dx = target.dx;
          let dy = target.dy;

          if (x < 5 || x > 95) dx *= -1;
          if (y < 7 || y > 91) dy *= -1;

          return {
            ...target,
            x: Math.max(5, Math.min(95, x)),
            y: Math.max(7, Math.min(91, y)),
            dx,
            dy,
          };
        })
      );
    }, 40);
    return () => window.clearInterval(movement);
  }, [playing]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key.toLowerCase() === "escape" && playing) {
        setPlaying(false);
      } else if (
        event.key.toLowerCase() === "enter" &&
        (!playing || finished)
      ) {
        startGame();
      } else if (event.key.toLowerCase() === "p" && playing) {
        setPlaying(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playing, finished, startGame]);

  function shoot(id) {
    if (!playing) return;
    setTargets((previous) => {
      const target = previous.find((item) => item.id === id);
      if (!target) return previous;

      setScore((value) => value + 100);
      setHits((value) => value + 1);

      return previous.map((item) =>
        item.id === id
          ? {
              ...item,
              x: 8 + Math.random() * 84,
              y: 12 + Math.random() * 76,
              size: 34 + Math.random() * 12,
            }
          : item
      );
    });
  }

  function shootMiss() {
    if (playing) setMisses((value) => value + 1);
  }

  return (
    <section className="neon-game" id="neon-game">
      <div className="ng-heading">
        <span className="ng-kicker">NEXORA TRAINING SIMULATOR</span>
        <h2>NEON <span>SHOOTER</span></h2>
        <p>Lock on. Take aim. Beat your high score.</p>
      </div>

      <div className="ng-stats">
        <div><small>SCORE</small><strong>{score}</strong></div>
        <div><small>TIME</small><strong className={timeLeft <= 10 ? "ng-danger" : ""}>{timeLeft}s</strong></div>
        <div><small>HITS</small><strong>{hits}</strong></div>
        <div><small>MISSES</small><strong>{misses}</strong></div>
      </div>

      <div
        className="ng-arena"
        ref={arenaRef}
        tabIndex={0}
        role="group"
        aria-label="Neon shooting arena. Click or tap targets to shoot."
        onClick={(event) => {
          if (event.target === event.currentTarget) shootMiss();
        }}
      >
        <div className="ng-grid" />
        {playing &&
          targets.map((target) => (
            <button
              key={target.id}
              type="button"
              className="ng-target"
              aria-label="Shoot target"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size}px`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                shoot(target.id);
              }}
            >
              <span />
            </button>
          ))}

        {!playing && (
          <div className="ng-overlay">
            <div className="ng-panel">
              <span className="ng-crosshair">＋</span>
              <h3>{finished ? "SESSION COMPLETE" : "READY, PLAYER?"}</h3>
              <p>
                {finished
                  ? `You scored ${score} points with ${hits} hits.`
                  : "Shoot the moving targets before time runs out."}
              </p>
              {finished && (
                <p className="ng-result">
                  Accuracy: {hits + misses === 0 ? 0 : Math.round((hits / (hits + misses)) * 100)}%
                </p>
              )}
              <button className="ng-start" onClick={startGame}>
                {finished ? "PLAY AGAIN" : "START GAME"}
              </button>
              <small>Press ENTER to start · P or ESC to pause</small>
            </div>
          </div>
        )}
      </div>

      <div className="ng-controls">
        <span>🖱️ Click targets to shoot</span>
        <span>📱 Tap targets on mobile</span>
        <button
          type="button"
          className="ng-sound"
          onClick={() => setSound((value) => !value)}
          aria-pressed={sound}
        >
          {sound ? "Sound setting: ON" : "Sound setting: OFF"}
        </button>
      </div>
      <p className="ng-note">
        Training mode · 100 points per target · P or ESC pauses the game
      </p>
    </section>
  );
}
