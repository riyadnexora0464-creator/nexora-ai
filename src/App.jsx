import { useEffect, useMemo, useState } from 'react';
import './App.css';

import NeonGame from './NeonGame';
import DartGame from './DartGame';
import ChessGame from './ChessGame';
import BrickBreaker from './BrickBreaker';
import NeonRacing from './NeonRacing';
import NeonRPG from './NeonRPG';
import GameFullscreen from './GameFullscreen';
import SnakesLadders from './SnakesLadders';

const COPY = {
  en: {
    nav: ['Home', 'Command Center', 'Games', 'AI Coach'],
    launch: 'Launch a game ↗',
    online: 'NEXORA SYSTEMS ONLINE',
    dashboard: 'PLAYER COMMAND CENTER',
    welcome: 'Welcome back, Player',
    overview: 'Your gaming universe at a glance.',
    level: 'PLAYER LEVEL',
    xp: 'TOTAL XP',
    best: 'BEST SCORE',
    sessions: 'GAMES AVAILABLE',
    quick: 'QUICK ACCESS',
    allGames: 'Explore all games',
    gamesTitle: 'Choose your next universe',
    gamesText: 'Seven ways to play. One place to level up.',
    search: 'Search games...',
    all: 'All games',
    action: 'Action',
    strategy: 'Strategy',
    racing: 'Racing',
    adventure: 'Adventure',
    play: 'Play now ↗',
    coachTitle: 'NEXORA AI COMPANION',
    coachSub: 'Your gaming co-pilot',
    coachText: 'Ask for training ideas, game recommendations or ways to improve your play.',
    ask: 'Ask Nexora',
    placeholder: 'e.g. How can I improve my aim?',
    coachHint: 'This assistant currently uses built-in guidance. Connect an AI API to enable live AI responses.',
    mission: 'DAILY MISSIONS',
    missionTitle: 'Your next objectives',
    missionText: 'Small challenges. Real progress.',
    missionItems: [
      'Play any game for 5 minutes',
      'Try a game you have not played before',
      'Ask the Nexora Coach for one tip'
    ],
    done: 'Completed',
    mark: 'Mark complete',
    progress: 'MISSION PROGRESS',
    features: 'WHY NEXORA',
    featuresTitle: 'More than a game library',
    featureCards: [
      ['🧠', 'Learn as you play', 'Use practical training ideas to build better habits and sharpen your decisions.'],
      ['⚡', 'Instant game access', 'Jump into your favourite mini-games from one central launcher.'],
      ['🏆', 'Track your journey', 'Keep your best scores and mission progress together on this device.'],
      ['🌐', 'One connected universe', 'Explore action, strategy, racing and adventure in one destination.']
    ],
    footer: 'Play smarter. Explore further. Level up.',
    tipAim: 'Keep your crosshair around head height, use small controlled movements and practise tracking for a few minutes each session.',
    tipTeam: 'Communicate one clear plan, stay close enough to support teammates and avoid taking fights alone.',
    tipStrategy: 'Set one clear objective before acting. Watch your opponent, manage resources and avoid making rushed moves.',
    tipGeneral: 'Choose one skill to practise at a time. Play a short focused session, then think about one thing you can improve.',
    recommendation: 'Try Neon Shooter for aim practice, Neon Chess for planning, or Neon Racing for reaction and timing.',
    categories: ['Action', 'Action', 'Strategy', 'Action', 'Racing', 'Adventure', 'Strategy'],
    names: [
      'Neon Shooter',
      'Neon Archery',
      'Neon Chess',
      'Neon Brick Breaker',
      'Neon Racing',
      'Neon Cyber Quest',
      'Snakes and Ladders'
    ],
    descriptions: [
      'Train your aim and reaction speed.',
      'Hit the targets and beat your score.',
      'Think ahead and plan your moves.',
      'Break through the neon wall.',
      'Race through the neon streets.',
      'Explore, fight and level up.',
      'A classic board-game challenge.'
    ]
  },

  zh: {
    nav: ['首页', '控制中心', '游戏', 'AI 教练'],
    launch: '开始游戏 ↗',
    online: 'NEXORA 系统在线',
    dashboard: '玩家控制中心',
    welcome: '欢迎回来，玩家',
    overview: '一览你的游戏世界。',
    level: '玩家等级',
    xp: '累计经验',
    best: '最佳成绩',
    sessions: '可玩游戏',
    quick: '快速入口',
    allGames: '探索所有游戏',
    gamesTitle: '选择你的下一个世界',
    gamesText: '七种玩法，一个不断进步的地方。',
    search: '搜索游戏...',
    all: '全部游戏',
    action: '动作',
    strategy: '策略',
    racing: '竞速',
    adventure: '冒险',
    play: '立即游玩 ↗',
    coachTitle: 'NEXORA AI 助手',
    coachSub: '你的游戏伙伴',
    coachText: '询问训练建议、游戏推荐或提升技巧的方法。',
    ask: '询问 Nexora',
    placeholder: '例如：怎样提高瞄准能力？',
    coachHint: '目前助手使用内置建议。连接 AI API 后即可启用实时 AI 回复。',
    mission: '每日任务',
    missionTitle: '你的下一个目标',
    missionText: '完成小挑战，积累真实进步。',
    missionItems: [
      '任意游戏游玩 5 分钟',
      '尝试一款以前没玩过的游戏',
      '向 Nexora 教练询问一个建议'
    ],
    done: '已完成',
    mark: '标记完成',
    progress: '任务进度',
    features: 'NEXORA 的优势',
    featuresTitle: '不只是游戏库',
    featureCards: [
      ['🧠', '边玩边学习', '通过实用训练建议培养更好的习惯并提升判断力。'],
      ['⚡', '快速进入游戏', '从一个中心游戏启动器打开你喜欢的小游戏。'],
      ['🏆', '记录你的旅程', '在此设备上保存最佳成绩和任务进度。'],
      ['🌐', '连接游戏世界', '在一个平台探索动作、策略、竞速和冒险游戏。']
    ],
    footer: '聪明地玩，探索更多，不断升级。',
    tipAim: '将准星保持在头部附近，使用小幅稳定移动，并在每次游戏中练习几分钟追踪目标。',
    tipTeam: '清晰表达一个计划，与队友保持支援距离，避免独自交战。',
    tipStrategy: '行动前设定一个明确目标。观察对手、管理资源，避免仓促行动。',
    tipGeneral: '每次专注练习一项技能。进行短时间训练，然后思考一个可以改进的地方。',
    recommendation: '试试霓虹射击练习瞄准，霓虹国际象棋练习规划，或霓虹赛车练习反应和节奏。',
    categories: ['动作', '动作', '策略', '动作', '竞速', '冒险', '策略'],
    names: [
      '霓虹射击',
      '霓虹射箭',
      '霓虹国际象棋',
      '霓虹打砖块',
      '霓虹赛车',
      '霓虹赛博冒险',
      '蛇梯棋'
    ],
    descriptions: [
      '训练瞄准和反应速度。',
      '击中目标并刷新成绩。',
      '提前思考并规划每一步。',
      '击碎霓虹砖墙。',
      '穿越霓虹城市竞速。',
      '探索、战斗并升级。',
      '经典棋盘游戏挑战。'
    ]
  }
};

const GAME_COMPONENTS = [
  NeonGame,
  DartGame,
  ChessGame,
  BrickBreaker,
  NeonRacing,
  NeonRPG,
  SnakesLadders
];

const GAME_ICONS = ['🎯', '🏹', '♟️', '🧱', '🏎️', '⚔️', '🎲'];
const STORAGE = 'nexora-player-v1';

function readPlayer() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');

    return {
      xp: Number(saved.xp) || 0,
      best: Number(saved.best) || 0,
      played: Array.isArray(saved.played) ? saved.played : [],
      missions: Array.isArray(saved.missions) ? saved.missions : []
    };
  } catch {
    return {
      xp: 0,
      best: 0,
      played: [],
      missions: []
    };
  }
}

function App() {
  const [language, setLanguage] = useState('en');
  const [player, setPlayer] = useState(readPlayer);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [activeGame, setActiveGame] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const t = COPY[language];

  const level = Math.floor(player.xp / 100) + 1;
  const missionDone = player.missions;

  const games = useMemo(() => {
    return t.names.map((name, index) => ({
      name,
      index,
      icon: GAME_ICONS[index],
      category: t.categories[index],
      description: t.descriptions[index]
    }));
  }, [t]);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(player));
  }, [player]);

  function openGame(index) {
    setActiveGame(index);

    setPlayer(current => ({
      ...current,
      xp: current.xp + 10,
      played: current.played.includes(index)
        ? current.played
        : [...current.played, index]
    }));
  }

  function completeMission(index) {
    setPlayer(current => {
      if (current.missions.includes(index)) {
        return current;
      }

      return {
        ...current,
        missions: [...current.missions, index],
        xp: current.xp + 25
      };
    });
  }

  function askCoach(event) {
    event.preventDefault();

    const q = question.trim().toLowerCase();

    if (!q) return;

    let response = t.tipGeneral;

    if (q.includes('aim') || q.includes('瞄准')) {
      response = t.tipAim;
    } else if (
      q.includes('team') ||
      q.includes('团队') ||
      q.includes('队友')
    ) {
      response = t.tipTeam;
    } else if (
      q.includes('strategy') ||
      q.includes('策略') ||
      q.includes('chess')
    ) {
      response = t.tipStrategy;
    } else if (
      q.includes('recommend') ||
      q.includes('推荐') ||
      q.includes('which game')
    ) {
      response = t.recommendation;
    }

    setAnswer(response);
  }

  const filteredGames = games.filter(game => {
    const matchesSearch =
      `${game.name} ${game.description} ${game.category}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      category === 'all' || game.category === t[category];

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="site-shell">

      {/* NAVIGATION */}
      <header className="navbar">

        <a className="brand" href="#home">
          <span className="brand-mark" aria-hidden="true">X</span>
          <span className="brand-wordmark">
            NEXORA
            <b>AI GAMING</b>
          </span>
        </a>

        <nav>
          <a href="#home">{t.nav[0]}</a>
          <a href="#dashboard">{t.nav[1]}</a>
          <a href="#games">{t.nav[2]}</a>
          <a href="#coach">{t.nav[3]}</a>
          <a href="#features">About</a>
          <a href="#footer">Contact</a>
        </nav>

        <div className="navbar-actions">

          <div className="language-switcher" aria-label="Choose language">
            <button
              type="button"
              className={language === 'en' ? 'language-button active' : 'language-button'}
              onClick={() => {
                setLanguage('en');
                setAnswer('');
              }}
              aria-pressed={language === 'en'}
            >
              EN
            </button>

            <button
              type="button"
              className={language === 'zh' ? 'language-button active' : 'language-button'}
              onClick={() => {
                setLanguage('zh');
                setAnswer('');
              }}
              aria-pressed={language === 'zh'}
            >
              中文
            </button>
          </div>

          <a className="nav-cta" href="#games">
            {t.launch}
          </a>

        </div>
      </header>

      <main>

        {/* HERO SECTION */}
        <section className="hero" id="home">

          <div className="hero-grid" />

          <div className="hero-copy">

            <span className="eyebrow">
              <i className="status-dot" />
              {t.online}
            </span>

            <div className="hero-brand-lockup">
              <span className="hero-x">X</span>

              <div>
                <strong>NEXORA</strong>
                <b>AI GAMING</b>
              </div>
            </div>

            <h1 className="reference-tagline">
              {language === 'en'
                ? 'Play smarter. Learn faster. Level up.'
                : '更聪明地玩，更快速地学习，不断升级。'}
            </h1>

            <p>
              {language === 'en'
                ? 'Next-gen AI powered games, personalized training, and endless fun — all in one place.'
                : '新一代 AI 游戏、个性化训练和无限乐趣，尽在一个平台。'}
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#games">
                {language === 'en' ? 'Start Playing →' : '开始游戏 →'}
              </a>

              <a className="button secondary" href="#games">
                {language === 'en' ? 'Explore Games' : '探索游戏'}
              </a>
            </div>

            <div className="hero-microstats">
              <span>
                <b>100+</b>
                {language === 'en' ? 'AI GAMES' : 'AI 游戏'}
              </span>

              <span>
                <b>50K+</b>
                {language === 'en' ? 'ACTIVE PLAYERS' : '活跃玩家'}
              </span>

              <span>
                <b>99%</b>
                {language === 'en' ? 'SATISFACTION RATE' : '满意度'}
              </span>
            </div>

          </div>

          {/* LARGE GAMER IMAGE */}
          <div className="hero-visual">
            <img
              className="hero-gamer-image"
              src="/nexora-assets/nexora-hero.jpg"
              alt="Futuristic Nexora gamer in a neon gaming city"
            />

            <div className="hero-image-glow" />
          </div>

        </section>

        {/* PLAYER DASHBOARD */}
        <section className="dashboard-section" id="dashboard">

          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">{t.dashboard}</span>
              <h2>{t.welcome}</h2>
              <p>{t.overview}</p>
            </div>

            <div className="level-pill">
              ✦ LVL {level}
            </div>
          </div>

          <div className="stat-grid">

            <article className="stat-card">
              <span>◈ {t.level}</span>
              <strong>{level}</strong>
              <small>
                {level * 100 - player.xp} XP {language === 'en' ? 'to next level' : '升级所需经验'}
              </small>
            </article>

            <article className="stat-card">
              <span>⚡ {t.xp}</span>
              <strong>{player.xp}</strong>
              <small>
                {language === 'en' ? 'Earn XP by exploring' : '探索即可获得经验'}
              </small>
            </article>

            <article className="stat-card">
              <span>🏆 {t.best}</span>
              <strong>{player.best || '—'}</strong>
              <small>
                {language === 'en' ? 'Personal record' : '个人纪录'}
              </small>
            </article>

            <article className="stat-card">
              <span>🎮 {t.sessions}</span>
              <strong>07</strong>
              <small>
                {language === 'en'
                  ? `${player.played.length} explored so far`
                  : `已体验 ${player.played.length} 款`}
              </small>
            </article>

          </div>

          <div className="dashboard-bottom">

            <div className="mini-panel">

              <div className="panel-title">
                <h3>{t.quick}</h3>
                <a href="#games">{t.allGames} ↗</a>
              </div>

              <div className="quick-games">
                {games.slice(0, 4).map(game => (
                  <button
                    key={game.index}
                    onClick={() => openGame(game.index)}
                  >
                    <span
                      className={`quick-game-art quick-game-art-${game.index + 1}`}
                      aria-hidden="true"
                    >
                      {game.icon}
                    </span>

                    <b>{game.name}</b>
                    <small>OPEN ↗</small>
                  </button>
                ))}
              </div>

            </div>

            <div className="mini-panel mission-panel">

              <div className="panel-title">
                <h3>{t.missionTitle}</h3>
                <span>{missionDone.length}/3</span>
              </div>

              <p>{t.missionText}</p>

              <div className="mission-progress">
                <span style={{ width: `${missionDone.length / 3 * 100}%` }} />
              </div>

              <small>{t.progress}</small>

            </div>

          </div>
        </section>

        {/* GAME LIBRARY */}
        <section className="games-section section" id="games">

          <div className="section-heading">
            <span className="eyebrow">{t.quick}</span>
            <h2>{t.gamesTitle}</h2>
            <p>{t.gamesText}</p>
          </div>

          <div className="game-tools">

            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t.search}
              aria-label={t.search}
            />

            <div className="category-filters">
              {['all', 'action', 'strategy', 'racing', 'adventure'].map(key => (
                <button
                  key={key}
                  className={category === key ? 'filter-chip selected' : 'filter-chip'}
                  onClick={() => setCategory(key)}
                >
                  {t[key]}
                </button>
              ))}
            </div>

          </div>

          <div className="game-grid">

            {filteredGames.map(game => (
              <article
                className={`game-card game-card-${game.index + 1}`}
                key={game.index}
              >

                <div className="game-art">
                  <span>{game.icon}</span>
                  <small>NX-{String(game.index + 1).padStart(2, '0')}</small>
                </div>

                <div className="game-meta">
                  <span>{game.category}</span>

                  <span>
                    {player.played.includes(game.index)
                      ? '✓ EXPLORED'
                      : '● READY'}
                  </span>
                </div>

                <h3>{game.name}</h3>
                <p>{game.description}</p>

                <button
                  className="game-launch"
                  onClick={() => openGame(game.index)}
                >
                  {t.play}
                </button>

              </article>
            ))}

            {filteredGames.length === 0 && (
              <p className="empty-state">
                {language === 'en'
                  ? 'No games match your search.'
                  : '没有找到符合条件的游戏。'}
              </p>
            )}

          </div>
        </section>

        {/* DAILY MISSIONS */}
        <section className="mission-section">

          <div>
            <span className="eyebrow">{t.mission}</span>
            <h2>{t.missionTitle}</h2>
            <p>{t.missionText}</p>
          </div>

          <div className="mission-list">

            {t.missionItems.map((item, index) => (
              <div className="mission-row" key={item}>

                <span className={missionDone.includes(index) ? 'mission-check checked' : 'mission-check'}>
                  {missionDone.includes(index) ? '✓' : `0${index + 1}`}
                </span>

                <p>{item}</p>

                <button
                  disabled={missionDone.includes(index)}
                  onClick={() => completeMission(index)}
                >
                  {missionDone.includes(index) ? t.done : t.mark}
                </button>

              </div>
            ))}

          </div>
        </section>

        {/* AI COACH */}
        <section className="coach-section" id="coach">

          <div className="coach-intro">
            <span className="eyebrow">{t.coachTitle}</span>
            <h2>{t.coachSub}</h2>
            <p>{t.coachText}</p>
            <div className="coach-orbit">🤖</div>
          </div>

          <form className="coach-box" onSubmit={askCoach}>

            <div className="coach-title">
              <span>✦</span>

              <div>
                <strong>NEXORA AI</strong>
                <small>
                  {language === 'en'
                    ? 'GAMING COMPANION · DEMO MODE'
                    : '游戏助手 · 演示模式'}
                </small>
              </div>

              <i className="status-dot" />
            </div>

            <label htmlFor="coachQuestion">
              {language === 'en'
                ? 'WHAT WOULD YOU LIKE HELP WITH?'
                : '你需要哪方面的帮助？'}
            </label>

            <input
              id="coachQuestion"
              value={question}
              onChange={event => setQuestion(event.target.value)}
              placeholder={t.placeholder}
            />

            <button className="button primary full-button" type="submit">
              {t.ask} ↗
            </button>

            {answer && (
              <div className="coach-answer">
                <strong>
                  {language === 'en' ? 'NEXORA SUGGESTION' : 'NEXORA 建议'}
                </strong>
                <p>{answer}</p>
              </div>
            )}

            <small className="coach-hint">{t.coachHint}</small>

          </form>
        </section>

        {/* FEATURES */}
        <section className="feature-strip" id="features">

          <span className="eyebrow">{t.features}</span>
          <h2>{t.featuresTitle}</h2>

          <div className="feature-grid">
            {t.featureCards.map(([icon, title, text]) => (
              <article className="feature-card" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer id="footer">

        <a className="brand" href="#home">
          <span className="brand-mark" aria-hidden="true">X</span>
          <span className="brand-wordmark">
            NEXORA
            <b>AI GAMING</b>
          </span>
        </a>

        <p>{t.footer}</p>

        <span>
          © {new Date().getFullYear()} NEXORA AI ·
          {language === 'en' ? ' BUILT FOR THE NEXT LEVEL' : ' 为下一等级而打造'}
        </span>

      </footer>

      {/* FLOATING AI ASSISTANT */}
      <button
        className="assistant-fab"
        onClick={() => setAssistantOpen(open => !open)}
        aria-label="Open Nexora assistant"
      >
        ✦
      </button>

      {assistantOpen && (
        <div className="assistant-popover">

          <div className="assistant-popover-head">
            <strong>✦ NEXORA AI</strong>

            <button
              onClick={() => setAssistantOpen(false)}
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <p>{t.coachText}</p>

          <button
            onClick={() => {
              setAssistantOpen(false);
              document.querySelector('#coach')?.scrollIntoView({
                behavior: 'smooth'
              });
            }}
          >
            {language === 'en' ? 'Open gaming coach ↗' : '打开游戏教练 ↗'}
          </button>

        </div>
      )}

      {/* GAME WINDOW */}
      {activeGame !== null && (
        <div
          className="game-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t.names[activeGame]}
        >

          <div className="game-modal-header">

            <div>
              <span className="eyebrow">NEXORA GAME SESSION</span>
              <h2>{t.names[activeGame]}</h2>
            </div>

            <button
              onClick={() => setActiveGame(null)}
              aria-label="Close game"
            >
              ×
            </button>

          </div>

          <div className="game-modal-content">
            <GameFullscreen title={t.names[activeGame]}>
              {(() => {
                const Game = GAME_COMPONENTS[activeGame];
                return <Game language={language} />;
              })()}
            </GameFullscreen>
          </div>

        </div>
      )}

    </div>
  );
}

export default App;