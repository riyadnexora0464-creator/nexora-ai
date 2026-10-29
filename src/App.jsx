import { useState } from 'react';
import './App.css';
import NeonGame from './NeonGame';
import DartGame from './DartGame';
import ChessGame from './ChessGame';
import BrickBreaker from './BrickBreaker';
import NeonRacing from './NeonRacing';
import NeonRPG from './NeonRPG';
import GameFullscreen from './GameFullscreen';
import SnakesLadders from './SnakesLadders';


const translations = {
  en: {
    home: 'Home',
    featuresNav: 'Features',
    labNav: 'AI Bot Lab',
    gamesNav: 'Games',
    coachNav: 'AI Coach',
    getStarted: 'Get Started ↗',
    eyebrow: '✦ THE NEXT GENERATION OF GAMING',
    heroTitle1: 'LEVEL UP',
    heroTitle2: 'WITH',
    heroSubtitle: 'Smarter Bots. Better Players. Bigger Dreams.',
    heroText: 'Discover how artificial intelligence transforms gaming — from intelligent opponents to personal training partners. Your next level starts here.',
    exploreFeatures: 'Explore AI Features ↗',
    tryLab: 'Try the Bot Lab ▷',
    practiceAnytime: 'Practice anytime',
    gamingCategories: 'Gaming categories',
    waysImprove: 'Ways to improve',
    featureEyebrow: 'POWERED BY INTELLIGENCE',
    featureTitle: 'Why AI Bots Change',
    everything: 'Everything',
    featureSubtitle: "AI isn't just a feature — it's your new gaming advantage.",
    discoverMore: 'Discover more',
    labEyebrow: 'INTERACTIVE EXPERIENCE',
    labTitle: 'Welcome to the',
    botLab: 'AI Bot Lab',
    labText: 'Test your skills, hit the neon targets, and beat your high score. Use your mouse, keyboard, or mobile touch controls.',
    gamesEyebrow: 'FIND YOUR PLAYSTYLE',
    gamesTitle: 'Explore Gaming',
    universes: 'Universes',
    gamesSubtitle: 'Different games. Different skills. One smarter way to improve.',
    trainGame: 'Train for this game ↗',
    coachEyebrow: 'YOUR PERSONAL STRATEGY PARTNER',
    coachTitle: 'Meet Your',
    gamingCoach: 'AI Gaming Coach',
    coachText: 'Ask for general gaming advice and get a helpful training tip instantly.',
    aim: 'Aim',
    strategy: 'Strategy',
    teamwork: 'Teamwork',
    coachName: 'NEXORA COACH',
    demoOnline: 'DEMO ASSISTANT · ONLINE',
    questionLabel: 'What do you want to improve?',
    questionPlaceholder: 'e.g. How can I improve my aim?',
    getAdvice: 'Get Training Advice ↗',
    trainingTip: 'YOUR TRAINING TIP',
    demoNote: 'This demo uses built-in tips, not a live AI model.',
    finalEyebrow: 'YOUR NEXT LEVEL IS WAITING',
    finalTitle: 'Ready to Play',
    smarter: 'Smarter?',
    finalText: 'Explore AI-powered training ideas and start building better gaming habits.',
    enterLab: 'Enter the Bot Lab ↗',
    footerText: 'Play smarter. Train better. Level up.',
    footerCopyright: 'Gaming, reimagined.',
    featureItems: [
      {
        icon: '🎯',
        title: 'Training Bots',
        text: 'Practice your aim, sharpen your reflexes, and build confidence before facing real players.',
      },
      {
        icon: '🤖',
        title: 'Smart Enemies',
        text: 'Discover game opponents that react to your actions and create new challenges.',
      },
      {
        icon: '🧠',
        title: 'AI Gaming Coach',
        text: 'Get personalized tips to improve your strategy, movement, and decision-making.',
      },
      {
        icon: '👥',
        title: 'AI Teammates',
        text: 'Fill empty team slots and learn the game with helpful virtual teammates.',
      },
    ],
    gameItems: [
      { name: 'FPS', icon: '🎯', text: 'Aim better. React faster.', type: 'Action' },
      { name: 'Strategy', icon: '♟️', text: 'Build smarter. Win bigger.', type: 'Strategy' },
      { name: 'Racing', icon: '🏎️', text: 'Perfect your lines. Beat the clock.', type: 'Racing' },
      { name: 'RPG', icon: '⚔️', text: 'Explore worlds. Level up.', type: 'Adventure' },
    ],
    gameTitles: [
      'Neon Shooter',
      'Neon Archery',
      'Neon Chess',
      'Neon Brick Breaker',
      'Neon Racing',
      'Neon Cyber Quest',
      'Snakes and Ladders',
    ],
    tips: [
      'Warm up for 10 minutes, practice one skill at a time, and review your mistakes.',
      'Use cover, watch your positioning, and avoid rushing into fights without a plan.',
      'Take short breaks, adjust your sensitivity gradually, and focus on consistency.',
    ],
    aimAnswer: 'Aim tip: keep your crosshair at head height, use short controlled movements, and practice tracking targets daily.',
    teamAnswer: 'Team tip: communicate clearly, stay near your teammates, and coordinate your moves before engaging.',
  },

  zh: {
    home: '首页',
    featuresNav: '功能介绍',
    labNav: 'AI 机器人实验室',
    gamesNav: '游戏',
    coachNav: 'AI 教练',
    getStarted: '立即开始 ↗',
    eyebrow: '✦ 新一代游戏体验',
    heroTitle1: '突破极限',
    heroTitle2: '与 AI',
    heroSubtitle: '更聪明的机器人，更强的玩家，更大的梦想。',
    heroText: '探索人工智能如何改变游戏世界——从智能对手到专属训练伙伴。你的进阶之旅从这里开始。',
    exploreFeatures: '探索 AI 功能 ↗',
    tryLab: '体验机器人实验室 ▷',
    practiceAnytime: '随时练习',
    gamingCategories: '游戏类别',
    waysImprove: '进步方式',
    featureEyebrow: '智能驱动游戏',
    featureTitle: '为什么 AI 机器人能改变',
    everything: '一切',
    featureSubtitle: 'AI 不只是一个功能，更是你提升游戏实力的优势。',
    discoverMore: '了解更多',
    labEyebrow: '互动游戏体验',
    labTitle: '欢迎来到',
    botLab: 'AI 机器人实验室',
    labText: '测试你的技巧，击中霓虹目标，刷新最高分。支持鼠标、键盘和手机触控操作。',
    gamesEyebrow: '找到你的游戏风格',
    gamesTitle: '探索游戏',
    universes: '世界',
    gamesSubtitle: '不同的游戏，不同的技巧，用更聪明的方式不断进步。',
    trainGame: '开始游戏训练 ↗',
    coachEyebrow: '你的专属策略伙伴',
    coachTitle: '认识你的',
    gamingCoach: 'AI 游戏教练',
    coachText: '询问游戏技巧，立即获取实用的训练建议。',
    aim: '瞄准',
    strategy: '策略',
    teamwork: '团队合作',
    coachName: 'NEXORA 教练',
    demoOnline: '演示助手 · 在线',
    questionLabel: '你想提升哪方面的能力？',
    questionPlaceholder: '例如：怎样提高我的瞄准能力？',
    getAdvice: '获取训练建议 ↗',
    trainingTip: '你的训练建议',
    demoNote: '此演示使用内置建议，并非实时 AI 模型。',
    finalEyebrow: '你的下一个等级正在等你',
    finalTitle: '准备好更',
    smarter: '聪明地游戏了吗？',
    finalText: '探索 AI 游戏训练技巧，培养更好的游戏习惯。',
    enterLab: '进入机器人实验室 ↗',
    footerText: '聪明游戏，认真训练，不断进步。',
    footerCopyright: '重新定义游戏体验。',
    featureItems: [
      {
        icon: '🎯',
        title: '训练机器人',
        text: '练习瞄准、提升反应速度，在面对真实玩家之前建立信心。',
      },
      {
        icon: '🤖',
        title: '智能敌人',
        text: '体验能够根据你的行动作出反应并带来全新挑战的游戏对手。',
      },
      {
        icon: '🧠',
        title: 'AI 游戏教练',
        text: '获取个性化建议，改善你的策略、移动技巧和决策能力。',
      },
      {
        icon: '👥',
        title: 'AI 队友',
        text: '让虚拟队友填补空缺位置，帮助你学习并提升游戏技巧。',
      },
    ],
    gameItems: [
      { name: '第一人称射击', icon: '🎯', text: '瞄得更准，反应更快。', type: '动作' },
      { name: '策略游戏', icon: '♟️', text: '策略更聪明，胜利更进一步。', type: '策略' },
      { name: '赛车', icon: '🏎️', text: '优化路线，挑战最快纪录。', type: '竞速' },
      { name: '角色扮演', icon: '⚔️', text: '探索世界，不断升级。', type: '冒险' },
    ],
    gameTitles: [
      '霓虹射击',
      '霓虹射箭',
      '霓虹国际象棋',
      '霓虹打砖块',
      '霓虹赛车',
      '霓虹赛博冒险',
      '蛇梯棋',
    ],
    tips: [
      '先热身 10 分钟，每次专注练习一项技能，并回顾自己的失误。',
      '善用掩体，注意站位，不要在没有计划的情况下贸然参战。',
      '适当休息，逐步调整操作灵敏度，并保持稳定的练习节奏。',
    ],
    aimAnswer: '瞄准建议：将准星保持在头部高度，使用短而稳定的移动，并每天练习追踪目标。',
    teamAnswer: '团队建议：清晰沟通，与队友保持配合，并在交战前协调行动。',
  },
};

function App() {
  const [language, setLanguage] = useState('en');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const t = translations[language];
  const features = t.featureItems;
  const games = t.gameItems;

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setAnswer('');
  }

  function askCoach(event) {
    event.preventDefault();

    if (!question.trim()) return;

    const lowerQuestion = question.toLowerCase();

    if (
      lowerQuestion.includes('aim') ||
      lowerQuestion.includes('瞄准')
    ) {
      setAnswer(t.aimAnswer);
    } else if (
      lowerQuestion.includes('team') ||
      lowerQuestion.includes('团队') ||
      lowerQuestion.includes('队友')
    ) {
      setAnswer(t.teamAnswer);
    } else {
      setAnswer(t.tips[Math.floor(Math.random() * t.tips.length)]);
    }
  }

  function scrollToLab() {
    document.querySelector('#lab')?.scrollIntoView({
      behavior: 'smooth',
    });
  }

  return (
    <div className="site-shell">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-mark">N</span>
          <span>NEXORA <b>AI</b></span>
        </a>

        <nav>
          <a href="#home">{t.home}</a>
          <a href="#features">{t.featuresNav}</a>
          <a href="#lab">{t.labNav}</a>
          <a href="#games">{t.gamesNav}</a>
          <a href="#coach">{t.coachNav}</a>
        </nav>

        <div className="navbar-actions">
          <div className="language-switcher" aria-label="Choose language">
            <button
              type="button"
              className={language === 'en' ? 'language-button active' : 'language-button'}
              onClick={() => changeLanguage('en')}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className={language === 'zh' ? 'language-button active' : 'language-button'}
              onClick={() => changeLanguage('zh')}
              aria-pressed={language === 'zh'}
            >
              中文
            </button>
          </div>

          <a className="nav-cta" href="#lab">
            {t.getStarted}
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-grid" />

          <div className="hero-copy">
            <span className="eyebrow">{t.eyebrow}</span>

            <h1>
              {t.heroTitle1}
              <br />
              {t.heroTitle2} <span>AI.</span>
            </h1>

            <h2>{t.heroSubtitle}</h2>
            <p>{t.heroText}</p>

            <div className="hero-actions">
              <a className="button primary" href="#features">
                {t.exploreFeatures}
              </a>
              <a className="button secondary" href="#lab">
                {t.tryLab}
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>24/7</strong>
                <span>{t.practiceAnytime}</span>
              </div>
              <div>
                <strong>4</strong>
                <span>{t.gamingCategories}</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>{t.waysImprove}</span>
              </div>
            </div>
          </div>

          <div
            className="hero-art"
            aria-label="Futuristic AI gaming robot illustration"
          >
            <img
              className="robot-image"
              src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80"
              alt="Futuristic robot"
            />

            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />

            <div className="floating-card card-top">
              AI SYSTEM <b>ONLINE ●</b>
            </div>

            <div className="floating-card card-bottom">
              PLAYER STATUS <b>READY TO LEVEL UP</b>
            </div>

            <div className="hero-glow" />
          </div>
        </section>

        <section className="section" id="features">
          <div className="section-heading">
            <span className="eyebrow">{t.featureEyebrow}</span>
            <h2>
              {t.featureTitle} <span>{t.everything}</span>
            </h2>
            <p>{t.featureSubtitle}</p>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <span className="card-number">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <a href="#lab">
                  {t.discoverMore} <span>↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="lab-section" id="lab">
          <div className="lab-copy">
            <span className="eyebrow">{t.labEyebrow}</span>
            <h2>
              {t.labTitle} <span>{t.botLab}</span>
            </h2>
            <p>{t.labText}</p>
          </div>

          <GameFullscreen title={t.gameTitles[0]}>
            <NeonGame />
          </GameFullscreen>

          <GameFullscreen title={t.gameTitles[1]}>
            <DartGame />
          </GameFullscreen>

          <GameFullscreen title={t.gameTitles[2]}>
            <ChessGame />
          </GameFullscreen>

          <GameFullscreen title={t.gameTitles[3]}>
            <BrickBreaker />
          </GameFullscreen>

          <GameFullscreen title={t.gameTitles[4]}>
            <NeonRacing />
          </GameFullscreen>

          <GameFullscreen title={t.gameTitles[5]}>
            <NeonRPG />
          </GameFullscreen>

          <GameFullscreen title={t.gameTitles[6]}>
            <SnakesLadders />
          </GameFullscreen>
        
        </section>

        <section className="section games-section" id="games">
          <div className="section-heading">
            <span className="eyebrow">{t.gamesEyebrow}</span>
            <h2>
              {t.gamesTitle} <span>{t.universes}</span>
            </h2>
            <p>{t.gamesSubtitle}</p>
          </div>

          <div className="game-grid">
            {games.map((game, index) => (
              <article
                className={`game-card game-${index + 1}`}
                key={game.name}
              >
                <div className="game-art">{game.icon}</div>
                <span className="game-type">{game.type}</span>
                <h3>{game.name} {language === 'en' ? 'GAMING' : '游戏'}</h3>
                <p>{game.text}</p>
                <button
                  className="text-button"
                  onClick={scrollToLab}
                  type="button"
                >
                  {t.trainGame}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="coach-section" id="coach">
          <div>
            <span className="eyebrow">{t.coachEyebrow}</span>
            <h2>
              {t.coachTitle} <span>{t.gamingCoach}</span>
            </h2>
            <p>{t.coachText}</p>

            <div className="coach-tags">
              <span>🎯 {t.aim}</span>
              <span>🧠 {t.strategy}</span>
              <span>🤝 {t.teamwork}</span>
            </div>
          </div>

          <form className="coach-box" onSubmit={askCoach}>
            <div className="coach-title">
              <span>🤖</span>
              <div>
                <strong>{t.coachName}</strong>
                <small>{t.demoOnline}</small>
              </div>
            </div>

            <label htmlFor="coachQuestion">{t.questionLabel}</label>

            <input
              id="coachQuestion"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t.questionPlaceholder}
            />

            <button className="button primary full-button" type="submit">
              {t.getAdvice}
            </button>

            {answer && (
              <div className="coach-answer">
                <strong>{t.trainingTip}</strong>
                <p>{answer}</p>
              </div>
            )}

            <small className="demo-note">{t.demoNote}</small>
          </form>
        </section>

        <section className="final-cta">
          <span className="eyebrow">{t.finalEyebrow}</span>
          <h2>
            {t.finalTitle} <span>{t.smarter}</span>
          </h2>
          <p>{t.finalText}</p>
          <a href="#lab" className="button primary">
            {t.enterLab}
          </a>
        </section>
      </main>

      <footer>
        <a className="brand" href="#home">
          <span className="brand-mark">N</span>
          <span>NEXORA <b>AI</b></span>
        </a>

        <p>{t.footerText}</p>

        <span>
          © {new Date().getFullYear()} NEXORA AI · {t.footerCopyright}
        </span>
      </footer>
    </div>
  );
}

export default App;