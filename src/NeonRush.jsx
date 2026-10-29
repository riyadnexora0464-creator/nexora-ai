
import { useCallback, useEffect, useRef, useState } from 'react';
import './NeonRush.css';

const STORAGE_KEY = 'nexora-neon-rush-v1';

const SKINS = [
  { id: 'purple', name: 'Neon Purple', nameZh: '霓虹紫', color: '#c084fc', cost: 0 },
  { id: 'cyan', name: 'Cyber Cyan', nameZh: '赛博青', color: '#22d3ee', cost: 100 },
  { id: 'pink', name: 'Laser Pink', nameZh: '激光粉', color: '#f472b6', cost: 250 },
  { id: 'gold', name: 'Solar Gold', nameZh: '太阳金', color: '#facc15', cost: 500 },
];

const TEXT = {
  en: {
    title: 'NEON RUSH',
    subtitle: 'RUN THE FUTURE',
    description: 'Dodge obstacles. Collect energy. Beat your best.',
    score: 'SCORE',
    best: 'PERSONAL BEST',
    orbs: 'TOTAL ORBS',
    start: 'START RUN',
    resume: 'RESUME RUN',
    restart: 'PLAY AGAIN',
    ready: 'READY TO RUN?',
    readyText: 'Choose a lane and prepare for the neon highway.',
    over: 'RUN COMPLETE',
    overText: 'Every run is a chance to beat your record.',
    crashed: 'You hit an obstacle!',
    paused: 'PAUSED',
    pause: 'PAUSE',
    continue: 'CONTINUE',
    left: 'LEFT',
    jump: 'JUMP',
    right: 'RIGHT',
    controls: 'Controls',
    keyboard: '← → move lanes · ↑ or Space jump · P pause',
    mobile: 'Use the buttons below the track on mobile.',
    skins: 'RUNNER STYLE',
    locked: 'Unlock',
    equipped: 'EQUIPPED',
    equip: 'EQUIP',
    leaderboard: 'YOUR TOP RUNS',
    noScores: 'Finish a run to start your leaderboard.',
    run: 'Run',
    settings: 'GAME OPTIONS',
    reminders: 'Break reminders',
    remindersText: 'Remind me to take a break after 15 minutes of play.',
    reminderOn: 'On',
    reminderOff: 'Off',
    reminderMessage: 'You have been playing for 15 minutes. Consider taking a short break!',
    close: 'Got it',
    unlocked: 'Skin unlocked!',
    notEnough: 'Collect more energy orbs to unlock this style.',
    help: 'Jump over obstacles and collect glowing orbs.',
    collected: 'ORBS',
  },
  zh: {
    title: '霓虹冲刺',
    subtitle: '奔向未来',
    description: '躲避障碍，收集能量，刷新你的纪录。',
    score: '分数',
    best: '个人最佳',
    orbs: '累计能量球',
    start: '开始冲刺',
    resume: '继续游戏',
    restart: '再玩一次',
    ready: '准备好了吗？',
    readyText: '选择路线，准备进入霓虹赛道。',
    over: '本次冲刺结束',
    overText: '每一次挑战都是刷新纪录的机会。',
    crashed: '你撞到了障碍物！',
    paused: '游戏已暂停',
    pause: '暂停',
    continue: '继续',
    left: '左移',
    jump: '跳跃',
    right: '右移',
    controls: '操作说明',
    keyboard: '← → 切换路线 · ↑ 或空格键跳跃 · P 暂停',
    mobile: '手机玩家可以使用赛道下方的按钮。',
    skins: '角色外观',
    locked: '解锁',
    equipped: '已装备',
    equip: '装备',
    leaderboard: '你的最佳成绩',
    noScores: '完成一局后，这里就会显示排行榜。',
    run: '第',
    settings: '游戏选项',
    reminders: '休息提醒',
    remindersText: '游玩 15 分钟后提醒我休息。',
    reminderOn: '开启',
    reminderOff: '关闭',
    reminderMessage: '你已经游玩了 15 分钟，建议休息一下！',
    close: '知道了',
    unlocked: '外观已解锁！',
    notEnough: '收集更多能量球来解锁此外观。',
    help: '跳过障碍物并收集发光的能量球。',
    collected: '能量球',
  },
};

function loadSavedGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') {
      return {
        best: Number(saved.best) || 0,
        totalOrbs: Number(saved.totalOrbs) || 0,
        scores: Array.isArray(saved.scores) ? saved.scores.slice(0, 5) : [],
        unlocked: Array.isArray(saved.unlocked)
          ? [...new Set(['purple', ...saved.unlocked])]
          : ['purple'],
        skin: SKINS.some((skin) => skin.id === saved.skin) ? saved.skin : 'purple',
      };
    }
  } catch {
    // Use a fresh save if browser storage is unavailable or invalid.
  }

  return { best: 0, totalOrbs: 0, scores: [], unlocked: ['purple'], skin: 'purple' };
}

function randomObstacle() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    lane: Math.floor(Math.random() * 3),
    y: -8,
    kind: Math.random() > 0.5 ? 'block' : 'barrier',
  };
}

function NeonRush() {
  const [language, setLanguage] = useState('en');
  const [saved, setSaved] = useState(loadSavedGame);
  const [status, setStatus] = useState('ready');
  const [lane, setLane] = useState(1);
  const [jumping, setJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [runOrbs, setRunOrbs] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [breakReminders, setBreakReminders] = useState(false);
  const [breakMessage, setBreakMessage] = useState(false);
  const [notice, setNotice] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const t = TEXT[language];
  const laneRef = useRef(1);
  const jumpingRef = useRef(false);
  const statusRef = useRef('ready');
  const scoreRef = useRef(0);
  const orbsRef = useRef(0);
  const savedRef = useRef(saved);
  const lastOrbRef = useRef(0);
  const jumpTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);

  useEffect(() => {
    savedRef.current = saved;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // The game still works if local storage is disabled.
    }
  }, [saved]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const moveLane = useCallback((direction) => {
    if (statusRef.current !== 'running') return;
    laneRef.current = Math.max(0, Math.min(2, laneRef.current + direction));
    setLane(laneRef.current);
  }, []);

  const jump = useCallback(() => {
    if (statusRef.current !== 'running' || jumpingRef.current) return;
    jumpingRef.current = true;
    setJumping(true);

    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
    jumpTimerRef.current = setTimeout(() => {
      jumpingRef.current = false;
      setJumping(false);
    }, 650);
  }, []);

  const pause = useCallback(() => {
    if (statusRef.current === 'running') {
      setStatus('paused');
    }
  }, []);

  const startRun = useCallback(() => {
    laneRef.current = 1;
    jumpingRef.current = false;
    scoreRef.current = 0;
    orbsRef.current = 0;
    lastOrbRef.current = 0;

    setLane(1);
    setJumping(false);
    setScore(0);
    setRunOrbs(0);
    setObstacles([]);
    setOrbs([]);
    setElapsed(0);
    setNotice('');
    setBreakMessage(false);
    setStatus('running');
  }, []);

  const finishRun = useCallback(() => {
    if (statusRef.current !== 'running') return;

    statusRef.current = 'over';
    setStatus('over');

    const finalScore = Math.floor(scoreRef.current);
    const collected = orbsRef.current;
    const old = savedRef.current;
    const newTotal = old.totalOrbs + collected;
    const unlocked = [...old.unlocked];

    SKINS.forEach((skin) => {
      if (newTotal >= skin.cost && !unlocked.includes(skin.id)) {
        unlocked.push(skin.id);
        setNotice(`${skin.name} — ${t.unlocked}`);
      }
    });

    const newScores = [...old.scores, finalScore]
      .sort((a, b) => b - a)
      .slice(0, 5);

    setSaved({
      ...old,
      best: Math.max(old.best, finalScore),
      totalOrbs: newTotal,
      scores: newScores,
      unlocked,
    });
  }, [t.unlocked]);

  useEffect(() => {
    if (status !== 'running') return undefined;

    const interval = setInterval(() => {
      setElapsed((value) => value + 0.1);

      scoreRef.current += 1;
      setScore(Math.floor(scoreRef.current));

      const speed = Math.min(3.2, 1.25 + scoreRef.current / 700);
      let hit = false;

      setObstacles((current) => {
        const moved = current
          .map((item) => ({ ...item, y: item.y + speed }))
          .filter((item) => item.y < 108);

        hit = moved.some(
          (item) =>
            item.y >= 79 &&
            item.y <= 91 &&
            item.lane === laneRef.current &&
            !jumpingRef.current
        );

        if (hit) {
          setTimeout(() => finishRun(), 0);
          return moved;
        }

        if (Math.random() < 0.055) moved.push(randomObstacle());
        return moved;
      });

      setOrbs((current) => {
        const moved = current
          .map((item) => ({ ...item, y: item.y + speed }))
          .filter((item) => item.y < 108);

        const collected = moved.filter(
          (item) =>
            item.y >= 79 &&
            item.y <= 91 &&
            item.lane === laneRef.current
        );

        if (collected.length) {
  orbsRef.current += collected.length;
  setRunOrbs(orbsRef.current);
}

        const remaining = moved.filter(
          (item) =>
            !(item.y >= 79 && item.y <= 91 && item.lane === laneRef.current)
        );

        if (Math.random() < 0.075) {
          remaining.push({
            id: `${Date.now()}-${Math.random()}`,
            lane: Math.floor(Math.random() * 3),
            y: -8,
          });
        }

        return remaining;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [status, finishRun, t.unlocked]);

  useEffect(() => {
    if (!breakReminders || status !== 'running') return undefined;

    const timer = setTimeout(() => {
      setBreakMessage(true);
      setStatus('paused');
    }, 15 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [breakReminders, status]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') moveLane(-1);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') moveLane(1);
      if (event.key === 'ArrowUp' || event.key === ' ') jump();
      if (event.key.toLowerCase() === 'p' && statusRef.current === 'running') pause();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLane, jump, pause]);

  useEffect(() => {
    return () => {
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  function equipSkin(skin) {
    if (!saved.unlocked.includes(skin.id)) {
      setNotice(t.notEnough);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = setTimeout(() => setNotice(''), 2500);
      return;
    }

    setSaved((old) => ({ ...old, skin: skin.id }));
  }

  const activeSkin = SKINS.find((skin) => skin.id === saved.skin) || SKINS[0];

  return (
    <section className="neon-rush" aria-label="Neon Rush game">
      <div className="nr-header">
        <div>
          <span className="nr-kicker">{t.subtitle}</span>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>
        <div className="nr-language" aria-label="Game language">
          <button className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')} type="button">EN</button>
          <button className={language === 'zh' ? 'selected' : ''} onClick={() => setLanguage('zh')} type="button">中文</button>
        </div>
      </div>

      <div className="nr-stats">
        <div><span>{t.score}</span><strong>{score}</strong></div>
        <div><span>{t.best}</span><strong>{saved.best}</strong></div>
        <div><span>{t.orbs}</span><strong>{saved.totalOrbs}</strong></div>
      </div>

      <div className="nr-track" role="application" aria-label="Neon Rush running track">
        <div className="nr-skyline" />
        <div className="nr-track-glow" />
        <div className="nr-lane-line line-one" />
        <div className="nr-lane-line line-two" />

        {obstacles.map((item) => (
          <div
            key={item.id}
            className={`nr-obstacle ${item.kind}`}
            style={{ left: `${16.67 + item.lane * 33.33}%`, top: `${item.y}%` }}
          />
        ))}

        {orbs.map((item) => (
          <div
            key={item.id}
            className="nr-orb"
            style={{ left: `${16.67 + item.lane * 33.33}%`, top: `${item.y}%` }}
          />
        ))}

        <div
          className={`nr-runner ${jumping ? 'is-jumping' : ''}`}
          style={{ left: `${16.67 + lane * 33.33}%`, color: activeSkin.color }}
        >
          <span className="nr-runner-head" />
          <span className="nr-runner-body" />
          <span className="nr-runner-leg leg-left" />
          <span className="nr-runner-leg leg-right" />
          <span className="nr-runner-shadow" />
        </div>

        {status !== 'running' && (
          <div className="nr-overlay">
            <div className="nr-overlay-card">
              <span className="nr-kicker">{t.title}</span>
              <h3>
                {status === 'ready' ? t.ready : status === 'paused' ? t.paused : t.over}
              </h3>
              <p>{status === 'ready' ? t.readyText : status === 'paused' ? t.continue : t.overText}</p>
              {status === 'over' && <p className="nr-crash">{t.crashed}</p>}
              <button className="nr-primary" type="button" onClick={status === 'paused' ? () => setStatus('running') : startRun}>
                {status === 'ready' ? t.start : status === 'paused' ? t.continue : t.restart}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="nr-help">{t.help}</p>

      <div className="nr-controls">
        <button type="button" onClick={() => moveLane(-1)} disabled={status !== 'running'}>← {t.left}</button>
        <button type="button" onClick={jump} disabled={status !== 'running'}>↑ {t.jump}</button>
        <button type="button" onClick={() => moveLane(1)} disabled={status !== 'running'}>{t.right} →</button>
        {status === 'running' && (
          <button type="button" onClick={pause}>{t.pause}</button>
        )}
      </div>

      <p className="nr-controls-note">{t.keyboard}</p>
      <p className="nr-controls-note">{t.mobile}</p>

      <div className="nr-panel">
        <h3>✦ {t.skins}</h3>
        <div className="nr-skins">
          {SKINS.map((skin) => {
            const unlocked = saved.unlocked.includes(skin.id);
            const equipped = saved.skin === skin.id;

            return (
              <div className={`nr-skin ${equipped ? 'equipped' : ''}`} key={skin.id}>
                <span className="nr-skin-swatch" style={{ background: skin.color }} />
                <strong>{language === 'en' ? skin.name : skin.nameZh}</strong>
                <small>{unlocked ? (equipped ? t.equipped : `${skin.cost} ${t.collected}`) : `${t.locked}: ${skin.cost}`}</small>
                <button type="button" onClick={() => equipSkin(skin)} disabled={equipped}>
                  {equipped ? t.equipped : unlocked ? t.equip : t.locked}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nr-bottom-grid">
        <div className="nr-panel">
          <h3>🏆 {t.leaderboard}</h3>
          {saved.scores.length === 0 ? (
            <p className="nr-muted">{t.noScores}</p>
          ) : (
            <ol className="nr-leaderboard">
              {saved.scores.map((value, index) => (
                <li key={`${value}-${index}`}>
                  <span>{language === 'en' ? `Run ${index + 1}` : `${t.run}${index + 1}局`}</span>
                  <strong>{value}</strong>
                </li>
              ))}
            </ol>
          )}
          <p className="nr-muted"> {language === 'en' ? 'Saved on this browser' : '成绩保存在此浏览器中'}</p>
        </div>

        <div className="nr-panel">
          <h3>⚙ {t.settings}</h3>
          <label className="nr-toggle">
            <span>
              <strong>{t.reminders}</strong>
              <small>{t.remindersText}</small>
            </span>
            <input
              type="checkbox"
              checked={breakReminders}
              onChange={(event) => setBreakReminders(event.target.checked)}
            />
          </label>
          {notice && <p className="nr-notice">{notice}</p>}
          <p className="nr-muted">
            {language === 'en'
              ? 'Your scores and unlocked styles are saved on this device.'
              : '你的成绩和已解锁外观保存在此设备上。'}
          </p>
        </div>
      </div>

      {breakMessage && (
        <div className="nr-break-backdrop">
          <div className="nr-break-dialog" role="dialog" aria-modal="true">
            <h3>☕ {language === 'en' ? 'Time for a break' : '休息一下吧'}</h3>
            <p>{t.reminderMessage}</p>
            <button
              className="nr-primary"
              type="button"
              onClick={() => {
                setBreakMessage(false);
                setStatus('paused');
              }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default NeonRush;
