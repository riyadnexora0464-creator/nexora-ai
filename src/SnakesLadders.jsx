
import { useEffect, useRef, useState } from "react";
import "./SnakesLadders.css";

const JUMPS = {
  4: 14,
  9: 31,
  17: 7,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  54: 34,
  62: 19,
  64: 60,
  71: 91,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

const SNAKES = new Set([17, 54, 62, 64, 87, 93, 95, 99]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TEXT = {
  en: {
    brand: "NEXORA",
    arcade: "ARCADE",
    neonBoardGame: "NEON BOARD GAME",
    eyebrow: "ROLL · CLIMB · CONQUER",
    title: "SNAKES",
    subtitle: "One roll can change everything. Race to square 100!",
    twoPlayers: "👥 Two Players",
    vsComputer: "🤖 Vs Computer",
    newGame: "↻ New Game",
    gameBoard: "GAME BOARD",
    squares: "100 SQUARES",
    snakeLegend: "Snake: slide down",
    ladderLegend: "Ladder: climb up",
    winner: "GAME WINNER",
    currentTurn: "CURRENT TURN",
    champion: "Champion of the board!",
    computerTurn: "Computer's turn",
    ready: "Ready to roll",
    rollDiceLabel: "Roll the dice",
    rolling: "ROLLING...",
    diceResult: "DICE RESULT",
    computerThinking: "🤖 COMPUTER THINKING...",
    gameFinished: "🏆 GAME FINISHED",
    rollingDice: "ROLLING THE DICE...",
    rollButton: "🎲 ROLL THE DICE",
    playerPositions: "PLAYER POSITIONS",
    computer: "Computer",
    moveHistory: "MOVE HISTORY",
    moves: "moves",
    historyEmpty: "Your adventure begins with the first roll.",
    footer: "✦ NEXORA AI ARCADE",
    exactRoll: "Exact roll needed to reach 100",
    startMessage: "Roll the dice to begin!",
    rollingMessage: (name) => `${name} is rolling...`,
    tooHighMessage: (name, result) =>
      `${name} rolled ${result}. You need an exact roll to reach 100!`,
    tooHighHistory: (name, result) =>
      `${name} rolled ${result} — needs an exact roll.`,
    snakeMessage: (name, position) =>
      `Oh no! A snake sent ${name} down to ${position}.`,
    ladderMessage: (name, position) =>
      `Amazing! A ladder took ${name} up to ${position}.`,
    moveHistoryEntry: (name, result, landed, finalPosition) =>
      `${name}: rolled ${result}, landed on ${landed}${
        finalPosition !== landed ? ` → ${finalPosition}` : ""
      }.`,
    movedMessage: (name, position) =>
      `${name} moved to square ${position}.`,
    winMessage: (name) => `🎉 ${name} wins the game!`,
  },

  zh: {
    brand: "NEXORA",
    arcade: "街机",
    neonBoardGame: "霓虹棋盘游戏",
    eyebrow: "掷骰 · 攀爬 · 冲刺",
    title: "蛇",
    subtitle: "一次掷骰就能改变一切！率先到达第 100 格！",
    twoPlayers: "👥 双人游戏",
    vsComputer: "🤖 对战电脑",
    newGame: "↻ 新游戏",
    gameBoard: "游戏棋盘",
    squares: "100 个格子",
    snakeLegend: "蛇：向下滑落",
    ladderLegend: "梯子：向上攀爬",
    winner: "获胜者",
    currentTurn: "当前回合",
    champion: "棋盘冠军！",
    computerTurn: "电脑回合",
    ready: "准备掷骰",
    rollDiceLabel: "掷骰子",
    rolling: "掷骰中...",
    diceResult: "骰子结果",
    computerThinking: "🤖 电脑思考中...",
    gameFinished: "🏆 游戏结束",
    rollingDice: "正在掷骰子...",
    rollButton: "🎲 掷骰子",
    playerPositions: "玩家位置",
    computer: "电脑",
    moveHistory: "移动记录",
    moves: "步",
    historyEmpty: "你的冒险将从第一次掷骰开始。",
    footer: "✦ NEXORA AI 街机",
    exactRoll: "必须掷出准确点数才能到达第 100 格",
    startMessage: "掷骰子开始游戏！",
    rollingMessage: (name) => `${name} 正在掷骰子...`,
    tooHighMessage: (name, result) =>
      `${name} 掷出了 ${result} 点。必须掷出准确点数才能到达第 100 格！`,
    tooHighHistory: (name, result) =>
      `${name} 掷出 ${result} 点 — 需要准确点数。`,
    snakeMessage: (name, position) =>
      `糟糕！${name} 被蛇带回了第 ${position} 格。`,
    ladderMessage: (name, position) =>
      `太棒了！${name} 通过梯子前进到第 ${position} 格。`,
    moveHistoryEntry: (name, result, landed, finalPosition) =>
      `${name}：掷出 ${result} 点，停在第 ${landed} 格${
        finalPosition !== landed ? ` → 第 ${finalPosition} 格` : ""
      }。`,
    movedMessage: (name, position) =>
      `${name} 前进到了第 ${position} 格。`,
    winMessage: (name) => `🎉 ${name} 赢得了比赛！`,
  },
};

function normalizeLanguage(language) {
  return String(language || "en").toLowerCase().startsWith("zh")
    ? "zh"
    : "en";
}

function getCellPosition(square) {
  const safeSquare = Math.max(1, Math.min(100, square));
  const rowFromBottom = Math.floor((safeSquare - 1) / 10);
  const offset = (safeSquare - 1) % 10;

  return {
    col: rowFromBottom % 2 === 0 ? offset : 9 - offset,
    row: 9 - rowFromBottom,
  };
}

function makeBoardPath(from, to) {
  const a = getCellPosition(from);
  const b = getCellPosition(to);

  const x1 = a.col * 100 + 50;
  const y1 = a.row * 100 + 50;
  const x2 = b.col * 100 + 50;
  const y2 = b.row * 100 + 50;

  const curve = Math.max(
    35,
    Math.min(150, Math.abs(x2 - x1) * 0.35 + 45)
  );
  const direction = x2 >= x1 ? 1 : -1;

  return `M ${x1} ${y1} C ${x1 + curve * direction} ${y1 - 20}, ${x2 - curve * direction} ${y2 + 20}, ${x2} ${y2}`;
}

export default function SnakesLadders({ language = "en" }) {
  const lang = normalizeLanguage(language);
  const t = TEXT[lang];

  const PLAYERS = [
    { name: lang === "zh" ? "玩家 1" : "Player 1", short: "P1", color: "#39e7ff", icon: "🔷" },
    { name: lang === "zh" ? "玩家 2" : "Player 2", short: "P2", color: "#ff63df", icon: "🟣" },
  ];

  const [mode, setMode] = useState("both");
  const [players, setPlayers] = useState([0, 0]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState({ key: "start" });
  const [history, setHistory] = useState([]);
  const [lastJump, setLastJump] = useState(null);

  const busyRef = useRef(false);
  const rollRef = useRef(null);
  const gameIdRef = useRef(0);

  function getPlayerName(player) {
    if (mode === "ai" && player === 1) {
      return t.computer;
    }

    return PLAYERS[player].name;
  }

  function getMessage() {
    switch (message.key) {
      case "start":
        return t.startMessage;
      case "rolling":
        return t.rollingMessage(getPlayerName(message.player));
      case "tooHigh":
        return t.tooHighMessage(getPlayerName(message.player), message.result);
      case "snake":
        return t.snakeMessage(getPlayerName(message.player), message.position);
      case "ladder":
        return t.ladderMessage(getPlayerName(message.player), message.position);
      case "moved":
        return t.movedMessage(getPlayerName(message.player), message.position);
      case "win":
        return t.winMessage(getPlayerName(message.player));
      default:
        return t.startMessage;
    }
  }

  function getHistoryText(item) {
    const name = getPlayerName(item.player);

    if (item.key === "tooHigh") {
      return t.tooHighHistory(name, item.result);
    }

    return t.moveHistoryEntry(
      name,
      item.result,
      item.landed,
      item.finalPosition
    );
  }

  function restartGame() {
    gameIdRef.current += 1;
    busyRef.current = false;

    setPlayers([0, 0]);
    setCurrentPlayer(0);
    setDice(1);
    setRolling(false);
    setWinner(null);
    setMessage({ key: "start" });
    setHistory([]);
    setLastJump(null);
  }

  async function rollDice(fromComputer = false) {
    if (busyRef.current || winner !== null) return;

    if (mode === "ai" && currentPlayer === 1 && !fromComputer) {
      return;
    }

    busyRef.current = true;

    const gameId = gameIdRef.current;
    const player = currentPlayer;

    setRolling(true);
    setLastJump(null);
    setMessage({ key: "rolling", player });

    for (let i = 0; i < 10; i++) {
      if (gameId !== gameIdRef.current) return;

      setDice(Math.floor(Math.random() * 6) + 1);
      await wait(75);
    }

    if (gameId !== gameIdRef.current) return;

    const result = Math.floor(Math.random() * 6) + 1;

    setDice(result);
    setRolling(false);

    const oldPosition = players[player];
    const proposedPosition = oldPosition + result;

    if (proposedPosition > 100) {
      setMessage({ key: "tooHigh", player, result });

      setHistory((prev) => [
        { key: "tooHigh", player, result },
        ...prev,
      ]);
    } else {
      for (
        let square = oldPosition + 1;
        square <= proposedPosition;
        square++
      ) {
        if (gameId !== gameIdRef.current) return;

        setPlayers((prev) =>
          prev.map((position, index) =>
            index === player ? square : position
          )
        );

        await wait(180);
      }

      if (gameId !== gameIdRef.current) return;

      let finalPosition = proposedPosition;
      let jumpType = null;

      if (JUMPS[proposedPosition]) {
        finalPosition = JUMPS[proposedPosition];

        const isSnake = SNAKES.has(proposedPosition);
        jumpType = isSnake ? "snake" : "ladder";

        setLastJump({
          from: proposedPosition,
          to: finalPosition,
          type: jumpType,
        });

        setPlayers((prev) =>
          prev.map((position, index) =>
            index === player ? finalPosition : position
          )
        );

        await wait(450);
      }

      if (gameId !== gameIdRef.current) return;

      setHistory((prev) => [
        {
          key: "move",
          player,
          result,
          landed: proposedPosition,
          finalPosition,
        },
        ...prev,
      ]);

      if (finalPosition === 100) {
        setWinner(player);
        setMessage({ key: "win", player });
        busyRef.current = false;
        return;
      }

      if (jumpType) {
        setMessage({
          key: jumpType,
          player,
          position: finalPosition,
        });
      } else {
        setMessage({
          key: "moved",
          player,
          position: finalPosition,
        });
      }
    }

    if (gameId !== gameIdRef.current) return;

    const nextPlayer = player === 0 ? 1 : 0;

    setCurrentPlayer(nextPlayer);
    busyRef.current = false;
  }

  // Save the latest roll function so the computer can call it.
  rollRef.current = rollDice;

  // Automatically give the computer its turn.
  useEffect(() => {
    if (mode !== "ai" || currentPlayer !== 1 || winner !== null) {
      return undefined;
    }

    const timer = setTimeout(() => {
      rollRef.current?.(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [mode, currentPlayer, winner, history]);

  const boardCells = Array.from({ length: 100 }, (_, index) => {
    const square = 100 - index;
    const { col, row } = getCellPosition(square);

    return { square, col, row };
  });

  const computerTurn = mode === "ai" && currentPlayer === 1;

  return (
    <main className="snakes-game">
      <header className="snakes-header">
        <div className="snakes-brand">
          <span className="snakes-brand-icon">✦</span>
          <span>
            {t.brand} <b>{t.arcade}</b>
          </span>
        </div>

        <span className="snakes-online">
          <span className="snakes-live-dot" />
          {t.neonBoardGame}
        </span>
      </header>

      <section className="snakes-intro">
        <p className="snakes-eyebrow">{t.eyebrow}</p>
        <h1>
          {t.title} <span>&amp;</span> {lang === "zh" ? "梯子" : "LADDERS"}
        </h1>
        <p className="snakes-subtitle">{t.subtitle}</p>
      </section>

      <div className="snakes-mode-row">
        <div className="snakes-mode-picker">
          <button
            className={mode === "both" ? "selected" : ""}
            onClick={() => {
              restartGame();
              setMode("both");
            }}
          >
            {t.twoPlayers}
          </button>

          <button
            className={mode === "ai" ? "selected" : ""}
            onClick={() => {
              restartGame();
              setMode("ai");
            }}
          >
            {t.vsComputer}
          </button>
        </div>

        <button className="snakes-restart" onClick={restartGame}>
          {t.newGame}
        </button>
      </div>

      <div className="snakes-layout">
        <section className="snakes-board-panel">
          <div className="snakes-board-topline">
            <span>{t.gameBoard}</span>
            <span>{t.squares}</span>
          </div>

          <div className="snakes-board">
            <div className="snakes-cells">
              {boardCells.map(({ square, col, row }) => {
                const playersHere = players
                  .map((position, index) => ({ position, index }))
                  .filter(
                    ({ position }) =>
                      position === square && position > 0
                  );

                const isSnakeHead = SNAKES.has(square);
                const isLadderBottom =
                  JUMPS[square] && !SNAKES.has(square);

                return (
                  <div
                    key={square}
                    className={[
                      "snakes-cell",
                      (row + col) % 2 === 0
                        ? "cell-dark"
                        : "cell-light",
                      square === 100 ? "cell-finish" : "",
                      square === 1 ? "cell-start" : "",
                    ].join(" ")}
                    style={{
                      gridColumn: col + 1,
                      gridRow: row + 1,
                    }}
                  >
                    <span className="snakes-number">{square}</span>

                    {isSnakeHead && (
                      <span className="snakes-cell-marker">🐍</span>
                    )}

                    {isLadderBottom && (
                      <span className="snakes-cell-marker">🪜</span>
                    )}

                    <div className="snakes-tokens">
                      {playersHere.map(({ index }) => (
                        <span
                          key={index}
                          className={`snakes-token token-${index}`}
                          title={PLAYERS[index].name}
                        >
                          {index + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <svg
              className="snakes-connections"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {Object.entries(JUMPS).map(([fromText, to]) => {
                const from = Number(fromText);
                const isSnake = SNAKES.has(from);

                return (
                  <g key={from}>
                    <path
                      d={makeBoardPath(from, to)}
                      className={
                        isSnake
                          ? "connection-snake"
                          : "connection-ladder"
                      }
                    />

                    <circle
                      cx={getCellPosition(from).col * 100 + 50}
                      cy={getCellPosition(from).row * 100 + 50}
                      r="15"
                      className={
                        isSnake
                          ? "connection-snake-dot"
                          : "connection-ladder-dot"
                      }
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="snakes-legend">
            <span>
              <i className="legend-snake" /> {t.snakeLegend}
            </span>
            <span>
              <i className="legend-ladder" /> {t.ladderLegend}
            </span>
          </div>
        </section>

        <aside className="snakes-sidebar">
          <section className="snakes-card snakes-turn-card">
            <p className="snakes-card-label">
              {winner !== null ? t.winner : t.currentTurn}
            </p>

            <div className="snakes-turn-player">
              <span
                className={`snakes-avatar avatar-${
                  winner !== null ? winner : currentPlayer
                }`}
              >
                {winner !== null
                  ? "🏆"
                  : PLAYERS[currentPlayer].icon}
              </span>

              <div>
                <h2>
                  {winner !== null
                    ? getPlayerName(winner)
                    : computerTurn
                      ? t.computer
                      : PLAYERS[currentPlayer].name}
                </h2>

                <p>
                  {winner !== null
                    ? t.champion
                    : computerTurn
                      ? t.computerTurn
                      : t.ready}
                </p>
              </div>
            </div>

            <div className="snakes-dice-area">
              <button
                className={`snakes-die ${
                  rolling ? "dice-rolling" : ""
                }`}
                onClick={() => rollDice()}
                disabled={
                  rolling ||
                  winner !== null ||
                  computerTurn
                }
                aria-label={t.rollDiceLabel}
              >
                {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][dice - 1]}
              </button>

              <span className="snakes-dice-caption">
                {rolling ? t.rolling : t.diceResult}
              </span>
            </div>

            <button
              className="snakes-roll-button"
              onClick={() => rollDice()}
              disabled={
                rolling ||
                winner !== null ||
                computerTurn
              }
            >
              {computerTurn
                ? t.computerThinking
                : winner !== null
                  ? t.gameFinished
                  : rolling
                    ? t.rollingDice
                    : t.rollButton}
            </button>

            <p className="snakes-message" aria-live="polite">
              {getMessage()}
            </p>
          </section>

          <section className="snakes-card snakes-score-card">
            <p className="snakes-card-label">{t.playerPositions}</p>

            {PLAYERS.map((player, index) => (
              <div className="snakes-score-row" key={player.short}>
                <span className={`snakes-score-avatar avatar-${index}`}>
                  {index === 0 ? "🔷" : "🟣"}
                </span>

                <div className="snakes-score-info">
                  <div className="snakes-score-name">
                    <span>
                      {mode === "ai" && index === 1
                        ? t.computer
                        : player.name}
                    </span>

                    <b>{players[index]}/100</b>
                  </div>

                  <div className="snakes-progress">
                    <span
                      className={`progress-${index}`}
                      style={{ width: `${players[index]}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="snakes-card snakes-history-card">
            <div className="snakes-history-heading">
              <p className="snakes-card-label">{t.moveHistory}</p>
              <span>{history.length} {t.moves}</span>
            </div>

            {history.length === 0 ? (
              <p className="snakes-history-empty">
                {t.historyEmpty}
              </p>
            ) : (
              <ul className="snakes-history-list">
                {history.slice(0, 6).map((item, index) => (
                  <li key={`${item.key}-${item.player}-${index}`}>
                    {getHistoryText(item)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <footer className="snakes-footer">
        <span>{t.footer}</span>
        <span>{t.exactRoll}</span>
      </footer>
    </main>
  );
}
