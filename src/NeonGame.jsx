
import { useCallback, useEffect, useRef, useState } from "react";
import "./NeonGame.css";

const GAME_TIME = 60;
const TARGET_COUNT = 5;

const translations = {
  en: {
    kicker: "NEXORA TRAINING SIMULATOR",
    title: "NEON",
    titleHighlight: "SHOOTER",
    subtitle: "Lock on. Take aim. Beat your high score.",
    score: "SCORE",
    time: "TIME",
    hits: "HITS",
    misses: "MISSES",
    arenaLabel: "Neon shooting arena. Click or tap targets to shoot.",
    shootTarget: "Shoot target",
    complete: "SESSION COMPLETE",
    ready: "READY, PLAYER?",
    result: (score, hits) =>
      `You scored ${score} points with ${hits} hits.`,
    instruction: "Shoot the moving targets before time runs out.",
    accuracy: "Accuracy",
    playAgain: "PLAY AGAIN",
    start: "START GAME",
    keyboard: "Press ENTER to start · P or ESC to pause",
    mouse: "🖱️ Click targets to shoot",
    mobile: "📱 Tap targets on mobile",
    soundOn: "Sound setting: ON",
    soundOff: "Sound setting: OFF",
    note: "Training mode · 100 points per target · P or ESC pauses the game",
  },

  zh: {
    kicker: "NEXORA 训练模拟器",
    title: "霓虹",
    titleHighlight: "射击",
    subtitle: "锁定目标，瞄准射击，刷新你的最高纪录。",
    score: "得分",
    time: "时间",
    hits: "命中",
    misses: "未命中",
    arenaLabel: "霓虹射击场。点击或触摸目标进行射击。",
    shootTarget: "射击目标",
    complete: "训练结束",
    ready: "准备好了吗，玩家？",
    result: (score, hits) =>
      `你获得了 ${score} 分，成功命中 ${hits} 次。`,
    instruction: "在时间结束前击中移动目标。",
    accuracy: "命中率",
    playAgain: "再玩一次",
    start: "开始游戏",
    keyboard: "按 ENTER 开始 · 按 P 或 ESC 暂停",
    mouse: "🖱️ 点击目标进行射击",
    mobile: "📱 在手机上触摸目标",
    soundOn: "音效设置：开启",
    soundOff: "音效设置：关闭",
    note: "训练模式 · 每次命中获得 100 分 · 按 P 或 ESC 暂停游戏",
  },
};

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

export default function NeonGame({ language = "en" }) {
  const t = translations[language] || translations.en;

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
    if (playing) {
      setMisses((value) => value + 1);
    }
  }

  const accuracy =
    hits + misses === 0
      ? 0
      : Math.round((hits / (hits + misses)) * 100);

  return (
    <section className="neon-game" id="neon-game">
      <div className="ng-heading">
        <span className="ng-kicker">{t.kicker}</span>

        <h2>
          {t.title} <span>{t.titleHighlight}</span>
        </h2>

        <p>{t.subtitle}</p>
      </div>

      <div className="ng-stats">
        <div>
          <small>{t.score}</small>
          <strong>{score}</strong>
        </div>

        <div>
          <small>{t.time}</small>
          <strong className={timeLeft <= 10 ? "ng-danger" : ""}>
            {timeLeft}s
          </strong>
        </div>

        <div>
          <small>{t.hits}</small>
          <strong>{hits}</strong>
        </div>

        <div>
          <small>{t.misses}</small>
          <strong>{misses}</strong>
        </div>
      </div>

      <div
        className="ng-arena"
        ref={arenaRef}
        tabIndex={0}
        role="group"
        aria-label={t.arenaLabel}
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
              aria-label={t.shootTarget}
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

              <h3>
                {finished ? t.complete : t.ready}
              </h3>

              <p>
                {finished
                  ? t.result(score, hits)
                  : t.instruction}
              </p>

              {finished && (
                <p className="ng-result">
                  {t.accuracy}: {accuracy}%
                </p>
              )}

              <button className="ng-start" onClick={startGame}>
                {finished ? t.playAgain : t.start}
              </button>

              <small>{t.keyboard}</small>
            </div>
          </div>
        )}
      </div>

      <div className="ng-controls">
        <span>{t.mouse}</span>

        <span>{t.mobile}</span>

        <button
          type="button"
          className="ng-sound"
          onClick={() => setSound((value) => !value)}
          aria-pressed={sound}
        >
          {sound ? t.soundOn : t.soundOff}
        </button>
      </div>

      <p className="ng-note">{t.note}</p>
    </section>
  );
}
