
import { useCallback, useEffect, useRef, useState } from "react";
import "./NeonGame.css";

const GAME_TIME = 60;
const TARGET_COUNT = 5;
const BEST_SCORE_KEY = "nexora-neon-best-score";

const translations = {
  en: {
    kicker: "NEXORA AI TRAINING SIMULATOR",
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
    paused: "GAME PAUSED",
    result: (score, hits) => `You scored ${score} points with ${hits} hits.`,
    instruction: "Shoot the moving targets before time runs out.",
    accuracy: "Accuracy",
    playAgain: "PLAY AGAIN",
    start: "START GAME",
    resume: "RESUME GAME",
    keyboard: "Press ENTER to start · P or ESC to pause",
    mouse: "🖱️ Click targets to shoot",
    mobile: "📱 Tap targets on mobile",
    soundOn: "Sound setting: ON",
    soundOff: "Sound setting: OFF",
    note: "Training mode · 100 points per target · P or ESC pauses the game",
    coach: "NEXORA AI COACH",
    difficulty: "AI difficulty",
    level: (n) => ["Beginner", "Easy", "Normal", "Advanced", "Expert"][n - 1],
    best: "BEST SCORE",
    streak: "HIT STREAK",
    adviceStart: "Start shooting. I'll analyse your performance.",
    adviceLow: "Try to aim carefully. Your accuracy is low. Focus on one target at a time.",
    adviceMedium: "Good practice! Try to improve your accuracy before increasing your speed.",
    adviceHigh: "Excellent accuracy! The AI is increasing the challenge.",
    adviceStreak: "Great streak! Keep your focus and maintain your accuracy.",
    adviceMiss: "You missed. Slow down and take a more accurate shot.",
    adviceFinish: (accuracy) =>
      accuracy >= 80
        ? "Excellent session! Your accuracy is impressive."
        : accuracy >= 50
        ? "Good effort! Practise your aim to improve your score."
        : "Keep practising. Focus on accuracy before speed.",
    aiDescription: "Difficulty adapts automatically to your performance.",
  },

  zh: {
    kicker: "NEXORA AI 训练模拟器",
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
    paused: "游戏已暂停",
    result: (score, hits) => `你获得了 ${score} 分，成功命中 ${hits} 次。`,
    instruction: "在时间结束前击中移动目标。",
    accuracy: "命中率",
    playAgain: "再玩一次",
    start: "开始游戏",
    resume: "继续游戏",
    keyboard: "按 ENTER 开始 · 按 P 或 ESC 暂停",
    mouse: "🖱️ 点击目标进行射击",
    mobile: "📱 在手机上触摸目标",
    soundOn: "音效设置：开启",
    soundOff: "音效设置：关闭",
    note: "训练模式 · 每次命中获得 100 分 · 按 P 或 ESC 暂停游戏",
    coach: "NEXORA AI 教练",
    difficulty: "AI 难度",
    level: (n) => ["初学者", "简单", "普通", "高级", "专家"][n - 1],
    best: "最高分",
    streak: "连续命中",
    adviceStart: "开始射击吧。我会分析你的表现。",
    adviceLow: "试着仔细瞄准。你的命中率较低，每次专注于一个目标。",
    adviceMedium: "练习得不错！在提高速度之前，先提高命中率。",
    adviceHigh: "命中率非常好！AI 正在增加挑战难度。",
    adviceStreak: "连续命中表现出色！保持专注和准确度。",
    adviceMiss: "没有命中。放慢速度，争取更准确的射击。",
    adviceFinish: (accuracy) =>
      accuracy >= 80
        ? "本次训练非常出色！你的命中率很高。"
        : accuracy >= 50
        ? "表现不错！继续练习瞄准，提高分数。"
        : "继续练习。先提高准确度，再追求速度。",
    aiDescription: "游戏难度会根据你的表现自动调整。",
  },
};

function makeTargets(difficulty = 1) {
  const size = Math.max(24, 46 - difficulty * 3);

  return Array.from({ length: TARGET_COUNT }, (_, id) => ({
    id,
    x: 12 + Math.random() * 76,
    y: 15 + Math.random() * 70,
    size: size + Math.random() * 5,
    dx: (Math.random() * 0.16 + 0.04) *
      (Math.random() > 0.5 ? 1 : -1),
    dy: (Math.random() * 0.12 + 0.03) *
      (Math.random() > 0.5 ? 1 : -1),
  }));
}

function getSavedBestScore() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function NeonGame({ language = "en" }) {
  const t = translations[language] || translations.en;

  const [targets, setTargets] = useState(() => makeTargets());
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);

  const [difficulty, setDifficulty] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(getSavedBestScore);
  const [coachMessage, setCoachMessage] = useState(t.adviceStart);

  const arenaRef = useRef(null);

  const accuracy =
    hits + misses === 0
      ? 0
      : Math.round((hits / (hits + misses)) * 100);

  const startGame = useCallback(() => {
    setTargets(makeTargets(1));
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(GAME_TIME);
    setDifficulty(1);
    setStreak(0);
    setFinished(false);
    setPaused(false);
    setPlaying(true);
    setCoachMessage(t.adviceStart);
    arenaRef.current?.focus();
  }, [t.adviceStart]);

  const resumeGame = useCallback(() => {
    setPaused(false);
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
          setPaused(false);
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
          const multiplier = 1 + (difficulty - 1) * 0.35;

          let x = target.x + target.dx * multiplier;
          let y = target.y + target.dy * multiplier;
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
  }, [playing, difficulty]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key.toLowerCase() === "escape" && playing) {
        setPlaying(false);
        setPaused(true);
      } else if (event.key.toLowerCase() === "p" && playing) {
        setPlaying(false);
        setPaused(true);
      } else if (
        event.key.toLowerCase() === "enter" &&
        paused
      ) {
        resumeGame();
      } else if (
        event.key.toLowerCase() === "enter" &&
        (!playing || finished)
      ) {
        startGame();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playing, finished, paused, startGame, resumeGame]);

  useEffect(() => {
    if (!finished) return;

    setCoachMessage(t.adviceFinish(accuracy));

    if (score > bestScore) {
      setBestScore(score);

      try {
        localStorage.setItem(BEST_SCORE_KEY, String(score));
      } catch {
        // The game still works if browser storage is unavailable.
      }
    }
  }, [finished, score, accuracy, bestScore, t]);

  function updateDifficulty(nextHits, nextMisses) {
    const attempts = nextHits + nextMisses;

    if (attempts < 5) return;

    const currentAccuracy = nextHits / attempts;

    if (currentAccuracy >= 0.8) {
      setDifficulty((previous) => Math.min(5, previous + 1));
      setCoachMessage(t.adviceHigh);
    } else if (currentAccuracy < 0.4) {
      setDifficulty((previous) => Math.max(1, previous - 1));
      setCoachMessage(t.adviceLow);
    } else {
      setCoachMessage(t.adviceMedium);
    }
  }

  function shoot(id) {
    if (!playing) return;

    const target = targets.find((item) => item.id === id);
    if (!target) return;

    const nextHits = hits + 1;

    setScore((value) => value + 100);
    setHits(nextHits);
    setStreak((value) => value + 1);

    if ((streak + 1) % 5 === 0) {
      setCoachMessage(t.adviceStreak);
    }

    updateDifficulty(nextHits, misses);

    setTargets((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              x: 8 + Math.random() * 84,
              y: 12 + Math.random() * 76,
              size: Math.max(24, 46 - difficulty * 3) +
                Math.random() * 5,
            }
          : item
      )
    );
  }

  function shootMiss() {
    if (!playing) return;

    const nextMisses = misses + 1;

    setMisses(nextMisses);
    setStreak(0);
    setCoachMessage(t.adviceMiss);

    updateDifficulty(hits, nextMisses);
  }

  const overlayTitle = finished
    ? t.complete
    : paused
    ? t.paused
    : t.ready;

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

              <h3>{overlayTitle}</h3>

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

              <button
                className="ng-start"
                onClick={
                  paused && !finished ? resumeGame : startGame
                }
              >
                {finished
                  ? t.playAgain
                  : paused
                  ? t.resume
                  : t.start}
              </button>

              <small>{t.keyboard}</small>
            </div>
          </div>
        )}
      </div>

      <div
        className="ng-ai-coach"
        style={{
          marginTop: "18px",
          padding: "18px",
          border: "1px solid rgba(0, 220, 255, 0.35)",
          borderRadius: "12px",
          background: "rgba(10, 20, 45, 0.65)",
          color: "#ffffff",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#00e5ff" }}>
          🤖 {t.coach}
        </h3>

        <p>{coachMessage}</p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "18px",
          }}
        >
          <span>
            <strong>{t.difficulty}:</strong>{" "}
            {t.level(difficulty)}
          </span>

          <span>
            <strong>{t.streak}:</strong> {streak}
          </span>

          <span>
            <strong>{t.best}:</strong> {bestScore}
          </span>
        </div>

        <small style={{ display: "block", marginTop: "10px", opacity: 0.75 }}>
          {t.aiDescription}
        </small>
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
