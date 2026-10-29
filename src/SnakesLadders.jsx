
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

const PLAYERS = [
  { name: "Player 1", short: "P1", color: "#39e7ff", icon: "🔷" },
  { name: "Player 2", short: "P2", color: "#ff63df", icon: "🟣" },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export default function SnakesLadders() {
  const [mode, setMode] = useState("both");
  const [players, setPlayers] = useState([0, 0]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState("Roll the dice to begin!");
  const [history, setHistory] = useState([]);
  const [lastJump, setLastJump] = useState(null);

  const busyRef = useRef(false);
  const rollRef = useRef(null);
  const gameIdRef = useRef(0);

  function restartGame() {
    gameIdRef.current += 1;
    busyRef.current = false;

    setPlayers([0, 0]);
    setCurrentPlayer(0);
    setDice(1);
    setRolling(false);
    setWinner(null);
    setMessage("Roll the dice to begin!");
    setHistory([]);
    setLastJump(null);
  }

  async function rollDice(fromComputer = false) {
    if (busyRef.current || winner !== null) return;

    if (
      mode === "ai" &&
      currentPlayer === 1 &&
      !fromComputer
    ) {
      return;
    }

    busyRef.current = true;

    const gameId = gameIdRef.current;
    const player = currentPlayer;

    setRolling(true);
    setLastJump(null);
    setMessage(`${PLAYERS[player].name} is rolling...`);

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
      setMessage(
        `${PLAYERS[player].name} rolled ${result}. You need an exact roll to reach 100!`
      );

      setHistory((prev) => [
        `${PLAYERS[player].name} rolled ${result} — needs an exact roll.`,
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
      let jumpMessage = "";

      if (JUMPS[proposedPosition]) {
        finalPosition = JUMPS[proposedPosition];

        const isSnake = SNAKES.has(proposedPosition);

        jumpMessage = isSnake
          ? `Oh no! A snake sent ${PLAYERS[player].name} down to ${finalPosition}.`
          : `Amazing! A ladder took ${PLAYERS[player].name} up to ${finalPosition}.`;

        setLastJump({
          from: proposedPosition,
          to: finalPosition,
          type: isSnake ? "snake" : "ladder",
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
        `${PLAYERS[player].name}: rolled ${result}, landed on ${proposedPosition}${
          finalPosition !== proposedPosition
            ? ` → ${finalPosition}`
            : ""
        }.`,
        ...prev,
      ]);

      if (finalPosition === 100) {
        setWinner(player);
        setMessage(`🎉 ${PLAYERS[player].name} wins the game!`);
        busyRef.current = false;
        return;
      }

      setMessage(
        jumpMessage ||
          `${PLAYERS[player].name} moved to square ${finalPosition}.`
      );
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

  return (
    <main className="snakes-game">
      <header className="snakes-header">
        <div className="snakes-brand">
          <span className="snakes-brand-icon">✦</span>
          <span>
            NEXORA <b>ARCADE</b>
          </span>
        </div>

        <span className="snakes-online">
          <span className="snakes-live-dot" />
          NEON BOARD GAME
        </span>
      </header>

      <section className="snakes-intro">
        <p className="snakes-eyebrow">ROLL · CLIMB · CONQUER</p>
        <h1>
          SNAKES <span>&amp;</span> LADDERS
        </h1>
        <p className="snakes-subtitle">
          One roll can change everything. Race to square 100!
        </p>
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
            👥 Two Players
          </button>

          <button
            className={mode === "ai" ? "selected" : ""}
            onClick={() => {
              restartGame();
              setMode("ai");
            }}
          >
            🤖 Vs Computer
          </button>
        </div>

        <button className="snakes-restart" onClick={restartGame}>
          ↻ New Game
        </button>
      </div>

      <div className="snakes-layout">
        <section className="snakes-board-panel">
          <div className="snakes-board-topline">
            <span>GAME BOARD</span>
            <span>100 SQUARES</span>
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
              <i className="legend-snake" /> Snake: slide down
            </span>
            <span>
              <i className="legend-ladder" /> Ladder: climb up
            </span>
          </div>
        </section>

        <aside className="snakes-sidebar">
          <section className="snakes-card snakes-turn-card">
            <p className="snakes-card-label">
              {winner !== null ? "GAME WINNER" : "CURRENT TURN"}
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
                    ? PLAYERS[winner].name
                    : isComputerTurn(mode, currentPlayer)
                      ? "Computer"
                      : PLAYERS[currentPlayer].name}
                </h2>

                <p>
                  {winner !== null
                    ? "Champion of the board!"
                    : isComputerTurn(mode, currentPlayer)
                      ? "Computer's turn"
                      : "Ready to roll"}
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
                  isComputerTurn(mode, currentPlayer)
                }
                aria-label="Roll the dice"
              >
                {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][dice - 1]}
              </button>

              <span className="snakes-dice-caption">
                {rolling ? "ROLLING..." : "DICE RESULT"}
              </span>
            </div>

            <button
              className="snakes-roll-button"
              onClick={() => rollDice()}
              disabled={
                rolling ||
                winner !== null ||
                isComputerTurn(mode, currentPlayer)
              }
            >
              {isComputerTurn(mode, currentPlayer)
                ? "🤖 COMPUTER THINKING..."
                : winner !== null
                  ? "🏆 GAME FINISHED"
                  : rolling
                    ? "ROLLING THE DICE..."
                    : "🎲 ROLL THE DICE"}
            </button>

            <p className="snakes-message" aria-live="polite">
              {message}
            </p>
          </section>

          <section className="snakes-card snakes-score-card">
            <p className="snakes-card-label">PLAYER POSITIONS</p>

            {PLAYERS.map((player, index) => (
              <div className="snakes-score-row" key={player.short}>
                <span className={`snakes-score-avatar avatar-${index}`}>
                  {index === 0 ? "🔷" : "🟣"}
                </span>

                <div className="snakes-score-info">
                  <div className="snakes-score-name">
                    <span>
                      {mode === "ai" && index === 1
                        ? "Computer"
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
              <p className="snakes-card-label">MOVE HISTORY</p>
              <span>{history.length} moves</span>
            </div>

            {history.length === 0 ? (
              <p className="snakes-history-empty">
                Your adventure begins with the first roll.
              </p>
            ) : (
              <ul className="snakes-history-list">
                {history.slice(0, 6).map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <footer className="snakes-footer">
        <span>✦ NEXORA AI ARCADE</span>
        <span>Exact roll needed to reach 100</span>
      </footer>
    </main>
  );
}

function isComputerTurn(mode, currentPlayer) {
  return mode === "ai" && currentPlayer === 1;
}
