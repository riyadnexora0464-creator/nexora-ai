
import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import './ChessGame.css';

const PIECES = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟︎' },
};

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 20000,
};

const FILES = 'abcdefgh';

function evaluatePosition(game) {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -100000 : 100000;
  }

  if (game.isDraw()) return 0;

  let score = 0;
  const board = game.board();

  board.forEach((row, r) => {
    row.forEach((piece, c) => {
      if (!piece) return;

      const value = PIECE_VALUES[piece.type];
      const direction = piece.color === 'w' ? 1 : -1;

      // Small positional bonus for advancing pawns and developing pieces.
      const centerBonus =
        (3.5 - Math.abs(3.5 - c)) * 4 +
        (3.5 - Math.abs(3.5 - r)) * 4;

      let bonus = centerBonus;

      if (piece.type === 'p') {
        const advance = piece.color === 'w' ? 6 - r : r - 1;
        bonus += advance * 7;
      }

      score += direction * (value + bonus);
    });
  });

  return score;
}

function searchBestMove(game, depth, alpha, beta) {
  if (depth === 0 || game.isGameOver()) {
    return evaluatePosition(game);
  }

  const moves = game.moves({ verbose: true });

  // Search captures first to improve pruning.
  moves.sort((a, b) => {
    const aValue = a.captured ? PIECE_VALUES[a.captured] : 0;
    const bValue = b.captured ? PIECE_VALUES[b.captured] : 0;
    return bValue - aValue;
  });

  if (game.turn() === 'w') {
    let best = -Infinity;

    for (const move of moves) {
      const next = new Chess(game.fen());
      next.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      best = Math.max(
        best,
        searchBestMove(next, depth - 1, alpha, beta),
      );

      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }

    return best;
  }

  let best = Infinity;

  for (const move of moves) {
    const next = new Chess(game.fen());
    next.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || 'q',
    });

    best = Math.min(
      best,
      searchBestMove(next, depth - 1, alpha, beta),
    );

    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }

  return best;
}

function chooseComputerMove(game, difficulty, botColor) {
  const depthByLevel = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
  };

  const depth = depthByLevel[difficulty] || 2;
  const moves = game.moves({ verbose: true });

  if (!moves.length) return null;

  const scoredMoves = moves.map((move) => {
    const next = new Chess(game.fen());

    next.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || 'q',
    });

    return {
      move,
      score: searchBestMove(next, depth - 1, -Infinity, Infinity),
    };
  });

  // Easy mode deliberately makes less consistent choices.
  if (difficulty === 'Easy') {
    scoredMoves.sort((a, b) =>
      botColor === 'w'
        ? b.score - a.score
        : a.score - b.score,
    );

    const pool = scoredMoves.slice(
      0,
      Math.max(1, Math.ceil(scoredMoves.length * 0.65)),
    );

    return pool[Math.floor(Math.random() * pool.length)].move;
  }

  scoredMoves.sort((a, b) =>
    botColor === 'w'
      ? b.score - a.score
      : a.score - b.score,
  );

  // Choose randomly among equally scored moves.
  const bestScore = scoredMoves[0].score;
  const equallyGood = scoredMoves.filter(
    (item) => item.score === bestScore,
  );

  return equallyGood[Math.floor(Math.random() * equallyGood.length)].move;
}

function getGameStatus(game, mode, playerColor, thinking) {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'Black' : 'White';

    if (mode === 'computer') {
      return winner.toLowerCase() === playerColor
        ? 'Checkmate! You win!'
        : 'Checkmate! The computer wins.';
    }

    return `Checkmate! ${winner} wins.`;
  }

  if (game.isStalemate()) return 'Draw by stalemate.';
  if (game.isThreefoldRepetition()) return 'Draw by threefold repetition.';
  if (game.isInsufficientMaterial()) return 'Draw — insufficient material.';
  if (game.isDraw()) return 'The game is a draw.';

  if (thinking) return 'Computer is thinking...';

  const sideToMove = game.turn() === 'w' ? 'White' : 'Black';
  const checkText = game.isCheck() ? ' — CHECK!' : '';

  if (mode === 'computer') {
    if (game.turn() === playerColor) {
      return `Your turn (${sideToMove})${checkText}`;
    }

    return `Computer's turn (${sideToMove})${checkText}`;
  }

  return `${sideToMove} to move${checkText}`;
}

export default function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState('computer');
  const [playerColor, setPlayerColor] = useState('w');
  const [difficulty, setDifficulty] = useState('Medium');
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [message, setMessage] = useState('');
  const [promotion, setPromotion] = useState(null);

  const gameOver = game.isGameOver();
  const botColor = playerColor === 'w' ? 'b' : 'w';

  useEffect(() => {
    if (
      mode !== 'computer' ||
      gameOver ||
      game.turn() === playerColor ||
      promotion
    ) {
      setThinking(false);
      return undefined;
    }

    setThinking(true);

    const timer = setTimeout(() => {
      try {
        const botMove = chooseComputerMove(
          game,
          difficulty,
          botColor,
        );

        if (botMove) {
          const next = new Chess(game.fen());

          next.move({
            from: botMove.from,
            to: botMove.to,
            promotion: botMove.promotion || 'q',
          });

          setGame(next);
          setHistory(next.history());
          setSelectedSquare(null);
          setLegalTargets([]);
          setMessage('');
        }
      } catch (error) {
        setMessage('The computer could not find a move. Please restart.');
      } finally {
        setThinking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [game, mode, playerColor, difficulty, botColor, gameOver, promotion]);

  function startNewGame(
    nextMode = mode,
    nextColor = playerColor,
    nextDifficulty = difficulty,
  ) {
    setGame(new Chess());
    setSelectedSquare(null);
    setLegalTargets([]);
    setHistory([]);
    setMode(nextMode);
    setPlayerColor(nextColor);
    setDifficulty(nextDifficulty);
    setThinking(false);
    setPromotion(null);
    setMessage('');
    setFlipped(nextMode === 'computer' && nextColor === 'b');
  }

  function undoMove() {
    if (thinking) return;

    const next = new Chess(game.fen());
    if (!next.history().length) return;

    next.undo();

    // In computer mode, undo the computer's reply as well,
    // so the player gets their turn back.
    if (
      mode === 'computer' &&
      next.history().length &&
      next.turn() !== playerColor
    ) {
      next.undo();
    }

    setGame(next);
    setHistory(next.history());
    setSelectedSquare(null);
    setLegalTargets([]);
    setPromotion(null);
    setMessage('');
  }

  function selectSquare(square) {
    if (gameOver || thinking || promotion) return;
    if (mode === 'computer' && game.turn() !== playerColor) return;

    const piece = game.get(square);

    if (selectedSquare) {
      const possible = game.moves({
        square: selectedSquare,
        verbose: true,
      });

      const chosen = possible.find((move) => move.to === square);

      if (chosen) {
        if (chosen.flags.includes('p')) {
          setPromotion({
            from: chosen.from,
            to: chosen.to,
          });
          return;
        }

        makeMove(selectedSquare, square);
        return;
      }
    }

    if (piece && piece.color === game.turn()) {
      const moves = game.moves({ square, verbose: true });

      setSelectedSquare(square);
      setLegalTargets(moves.map((move) => move.to));
      setMessage('');
    } else {
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  }

  function makeMove(from, to, promotionPiece = 'q') {
    try {
      const next = new Chess(game.fen());

      next.move({
        from,
        to,
        promotion: promotionPiece,
      });

      setGame(next);
      setHistory(next.history());
      setSelectedSquare(null);
      setLegalTargets([]);
      setPromotion(null);
      setMessage('');
    } catch {
      setMessage('That move is not legal. Please choose another square.');
    }
  }

  function handleSquareClick(square) {
    if (selectedSquare && promotion) return;
    selectSquare(square);
  }

  const board = game.board();
  const rows = Array.from({ length: 8 }, (_, i) => i);
  const columns = Array.from({ length: 8 }, (_, i) => i);

  if (flipped) {
    rows.reverse();
    columns.reverse();
  }

  const status = getGameStatus(
    game,
    mode,
    playerColor,
    thinking,
  );

  return (
    <section className="chess-game" id="chess-game">
      <div className="chess-heading">
        <span className="chess-eyebrow">NEXORA AI ARCADE</span>
        <h2>NEON <span>CHESS</span></h2>
        <p>Challenge the computer. Plan your moves. Own the board.</p>
      </div>

      <div className="chess-layout">
        <div className="chess-board-panel">
          <div className="chess-status" aria-live="polite">
            <span className={game.isCheck() ? 'status-dot check' : 'status-dot'} />
            {status}
          </div>

          <div className="chess-board" role="group" aria-label="Chess board">
            {rows.map((rowIndex) =>
              columns.map((colIndex) => {
                const square = `${FILES[colIndex]}${8 - rowIndex}`;
                const piece = board[rowIndex][colIndex];
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = selectedSquare === square;
                const isTarget = legalTargets.includes(square);
                const lastMove = game.history({ verbose: true }).slice(-1)[0];
                const isLastMove =
                  lastMove &&
                  (lastMove.from === square || lastMove.to === square);

                return (
                  <button
                    key={square}
                    type="button"
                    className={[
                      'chess-square',
                      isLight ? 'light' : 'dark',
                      isSelected ? 'selected' : '',
                      isTarget ? 'legal-target' : '',
                      isLastMove ? 'last-move' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleSquareClick(square)}
                    aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                  >
                    {piece && (
                      <span
                        className={`chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}
                      >
                        {PIECES[piece.color][piece.type]}
                      </span>
                    )}
                    {isTarget && !piece && <span className="move-dot" />}
                    {isTarget && piece && <span className="capture-ring" />}
                    <span className="square-label">
                      {colIndex === 0 ? 8 - rowIndex : ''}
                    </span>
                    <span className="square-file">
                      {rowIndex === 7 ? FILES[colIndex] : ''}
                    </span>
                  </button>
                );
              }),
            )}
          </div>

          {promotion && (
            <div className="promotion-panel">
              <p>Choose your promotion piece</p>
              <div className="promotion-options">
                {['q', 'r', 'b', 'n'].map((pieceType) => (
                  <button
                    key={pieceType}
                    type="button"
                    onClick={() =>
                      makeMove(promotion.from, promotion.to, pieceType)
                    }
                  >
                    {PIECES[game.turn()][pieceType]}
                  </button>
                ))}
                <button
                  type="button"
                  className="promotion-cancel"
                  onClick={() => setPromotion(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="chess-actions">
            <button
              type="button"
              onClick={undoMove}
              disabled={!history.length || thinking}
            >
              ↶ Undo
            </button>
            <button
              type="button"
              onClick={() => setFlipped((value) => !value)}
            >
              ⇅ Flip Board
            </button>
            <button
              type="button"
              className="new-game-button"
              onClick={() => startNewGame()}
            >
              + New Game
            </button>
          </div>

          {message && <p className="chess-message">{message}</p>}
        </div>

        <aside className="chess-sidebar">
          <div className="chess-control-card">
            <h3>GAME SETTINGS</h3>

            <label htmlFor="chess-mode">Play mode</label>
            <select
              id="chess-mode"
              value={mode}
              onChange={(event) =>
                startNewGame(event.target.value, playerColor, difficulty)
              }
            >
              <option value="computer">🤖 vs Computer</option>
              <option value="local">👥 Two Players</option>
            </select>

            {mode === 'computer' && (
              <>
                <label htmlFor="chess-color">Play as</label>
                <select
                  id="chess-color"
                  value={playerColor}
                  onChange={(event) =>
                    startNewGame(mode, event.target.value, difficulty)
                  }
                >
                  <option value="w">⚪ White — move first</option>
                  <option value="b">⚫ Black — computer starts</option>
                </select>

                <label htmlFor="chess-difficulty">Computer difficulty</label>
                <select
                  id="chess-difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    startNewGame(mode, playerColor, event.target.value)
                  }
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <div className="difficulty-note">
                  <span className="difficulty-icon">✦</span>
                  <span>
                    {difficulty === 'Easy' &&
                      'Easy: relaxed play with more varied moves.'}
                    {difficulty === 'Medium' &&
                      'Medium: searches ahead and considers captures.'}
                    {difficulty === 'Hard' &&
                      'Hard: searches deeper to find stronger moves.'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="chess-control-card">
            <h3>MOVE HISTORY</h3>
            <div className="move-history">
              {history.length === 0 ? (
                <p className="history-empty">
                  Your moves will appear here once the game begins.
                </p>
              ) : (
                <div className="move-list">
                  {Array.from(
                    { length: Math.ceil(history.length / 2) },
                    (_, index) => (
                      <div className="move-row" key={index}>
                        <span className="move-number">{index + 1}.</span>
                        <span>{history[index * 2] || ''}</span>
                        <span>{history[index * 2 + 1] || ''}</span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="chess-tip">
            <span>◈</span>
            <div>
              <strong>STRATEGY TIP</strong>
              <p>Control the center, develop your pieces, and protect your king.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
