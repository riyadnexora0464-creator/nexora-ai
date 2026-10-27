
import { useState } from 'react';
import './App.css';

const features = [
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
];

const games = [
  { name: 'FPS', icon: '🎯', text: 'Aim better. React faster.', type: 'Action' },
  { name: 'Strategy', icon: '♟️', text: 'Build smarter. Win bigger.', type: 'Strategy' },
  { name: 'Racing', icon: '🏎️', text: 'Perfect your lines. Beat the clock.', type: 'Racing' },
  { name: 'RPG', icon: '⚔️', text: 'Explore worlds. Level up.', type: 'Adventure' },
];

function App() {
  const [difficulty, setDifficulty] = useState('Medium');
  const [gameMode, setGameMode] = useState('FPS');
  const [score, setScore] = useState(0);
  const [training, setTraining] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  function startTraining() {
    setTraining(true);
    setScore(0);
  }

  function practice() {
    setScore((previous) =>
      previous + (difficulty === 'Hard' ? 15 : difficulty === 'Easy' ? 5 : 10)
    );
  }

  function askCoach(event) {
    event.preventDefault();

    if (!question.trim()) return;

    const lowerQuestion = question.toLowerCase();

    const tips = [
      'Warm up for 10 minutes, practice one skill at a time, and review your mistakes.',
      'Use cover, watch your positioning, and avoid rushing into fights without a plan.',
      'Take short breaks, adjust your sensitivity gradually, and focus on consistency.',
    ];

    if (lowerQuestion.includes('aim')) {
      setAnswer(
        'Aim tip: keep your crosshair at head height, use short controlled movements, and practice tracking targets daily.'
      );
    } else if (lowerQuestion.includes('team')) {
      setAnswer(
        'Team tip: communicate clearly, stay near your teammates, and coordinate your moves before engaging.'
      );
    } else {
      setAnswer(tips[Math.floor(Math.random() * tips.length)]);
    }
  }

  return (
    <div className="site-shell">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-mark">N</span>
          <span>NEXORA <b>AI</b></span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#lab">AI Bot Lab</a>
          <a href="#games">Games</a>
          <a href="#coach">AI Coach</a>
        </nav>

        <a className="nav-cta" href="#lab">Get Started ↗</a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-grid" />

          <div className="hero-copy">
            <span className="eyebrow">
              ✦ THE NEXT GENERATION OF GAMING
            </span>

            <h1>
              LEVEL UP
              <br />
              WITH <span>AI.</span>
            </h1>

            <h2>Smarter Bots. Better Players. Bigger Dreams.</h2>

            <p>
              Discover how artificial intelligence transforms gaming —
              from intelligent opponents to personal training partners.
              Your next level starts here.
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#features">
                Explore AI Features ↗
              </a>
              <a className="button secondary" href="#lab">
                Try the Bot Lab ▷
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>24/7</strong>
                <span>Practice anytime</span>
              </div>
              <div>
                <strong>4</strong>
                <span>Gaming categories</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>Ways to improve</span>
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
            <span className="eyebrow">POWERED BY INTELLIGENCE</span>
            <h2>
              Why AI Bots Change <span>Everything</span>
            </h2>
            <p>AI isn't just a feature — it's your new gaming advantage.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <span className="card-number">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <a href="#lab">
                  Discover more <span>↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="lab-section" id="lab">
          <div className="lab-copy">
            <span className="eyebrow">INTERACTIVE EXPERIENCE</span>
            <h2>
              Welcome to the <span>AI Bot Lab</span>
            </h2>
            <p>
              Choose a game and difficulty, then start your simulated
              training session.
            </p>

            <label htmlFor="gameMode">Game mode</label>
            <select
              id="gameMode"
              value={gameMode}
              onChange={(event) => setGameMode(event.target.value)}
            >
              {games.map((game) => (
                <option key={game.name} value={game.name}>
                  {game.name}
                </option>
              ))}
            </select>

            <label htmlFor="difficulty">Bot difficulty</label>
            <div className="difficulty-options">
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <button
                  key={level}
                  className={`difficulty ${
                    difficulty === level ? 'selected' : ''
                  }`}
                  onClick={() => setDifficulty(level)}
                  type="button"
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              className="button primary full-button"
              onClick={startTraining}
              type="button"
            >
              {training ? 'Restart Training ↻' : 'Start Training ▶'}
            </button>
          </div>

          <div className="lab-screen">
            <div className="screen-top">
              <span>● SIMULATION LIVE</span>
              <span>BOT: {difficulty.toUpperCase()}</span>
            </div>

            <div className="arena">
              <div className="arena-sun" />
              <div className="target target-one">✳</div>
              <div className="target target-two">✳</div>
              <div className="arena-player">🎮</div>
              <div className="crosshair">+</div>
              <div className="arena-caption">
                {gameMode.toUpperCase()} TRAINING ZONE
              </div>
            </div>

            <div className="score-row">
              <div>
                <span>YOUR SCORE</span>
                <strong>{score}</strong>
              </div>

              <div>
                <span>DIFFICULTY</span>
                <strong>{difficulty}</strong>
              </div>

              <button
                className="button primary"
                onClick={training ? practice : startTraining}
                type="button"
              >
                {training ? 'Hit Target + Score' : 'Enter Arena →'}
              </button>
            </div>

            <p className="demo-note">
              {training
                ? `Training active: ${gameMode} mode. Hit the target to earn points!`
                : 'This is a website demo, not a connection to a real game.'}
            </p>
          </div>
        </section>

        <section className="section games-section" id="games">
          <div className="section-heading">
            <span className="eyebrow">FIND YOUR PLAYSTYLE</span>
            <h2>
              Explore Gaming <span>Universes</span>
            </h2>
            <p>
              Different games. Different skills. One smarter way to improve.
            </p>
          </div>

          <div className="game-grid">
            {games.map((game, index) => (
              <article
                className={`game-card game-${index + 1}`}
                key={game.name}
              >
                <div className="game-art">{game.icon}</div>
                <span className="game-type">{game.type}</span>
                <h3>{game.name} GAMING</h3>
                <p>{game.text}</p>

                <button
                  className="text-button"
                  onClick={() => {
                    setGameMode(game.name);
                    document
                      .querySelector('#lab')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  type="button"
                >
                  Train for this game ↗
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="coach-section" id="coach">
          <div>
            <span className="eyebrow">
              YOUR PERSONAL STRATEGY PARTNER
            </span>
            <h2>
              Meet Your <span>AI Gaming Coach</span>
            </h2>
            <p>
              Ask for general gaming advice and get a helpful training tip
              instantly.
            </p>

            <div className="coach-tags">
              <span>🎯 Aim</span>
              <span>🧠 Strategy</span>
              <span>🤝 Teamwork</span>
            </div>
          </div>

          <form className="coach-box" onSubmit={askCoach}>
            <div className="coach-title">
              <span>🤖</span>
              <div>
                <strong>NEXORA COACH</strong>
                <small>DEMO ASSISTANT · ONLINE</small>
              </div>
            </div>

            <label htmlFor="coachQuestion">
              What do you want to improve?
            </label>

            <input
              id="coachQuestion"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. How can I improve my aim?"
            />

            <button
              className="button primary full-button"
              type="submit"
            >
              Get Training Advice ↗
            </button>

            {answer && (
              <div className="coach-answer">
                <strong>YOUR TRAINING TIP</strong>
                <p>{answer}</p>
              </div>
            )}

            <small className="demo-note">
              This demo uses built-in tips, not a live AI model.
            </small>
          </form>
        </section>

        <section className="final-cta">
          <span className="eyebrow">YOUR NEXT LEVEL IS WAITING</span>
          <h2>
            Ready to Play <span>Smarter?</span>
          </h2>
          <p>
            Explore AI-powered training ideas and start building better
            gaming habits.
          </p>
          <a href="#lab" className="button primary">
            Enter the Bot Lab ↗
          </a>
        </section>
      </main>

      <footer>
        <a className="brand" href="#home">
          <span className="brand-mark">N</span>
          <span>NEXORA <b>AI</b></span>
        </a>
        <p>Play smarter. Train better. Level up.</p>
        <span>
          © {new Date().getFullYear()} NEXORA AI · Gaming, reimagined.
        </span>
      </footer>
    </div>
  );
}

export default App;
