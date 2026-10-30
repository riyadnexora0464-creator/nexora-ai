
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

const TEXT = {
  en: {
    eyebrow: 'NEXORA AI ARCADE',
    title: 'NEON',
    titleAccent: 'CHESS',
    subtitle: 'Challenge the computer. Plan your moves. Own the board.',
    board: 'Chess board',
    white: 'White',
    black: 'Black',
    check: ' — CHECK!',
    checkmate: 'Checkmate!',
    youWin: 'You win!',
    computerWins: 'The computer wins.',
    stalemate: 'Draw by stalemate.',
    repetition: 'Draw by threefold repetition.',
    insufficient: 'Draw — insufficient material.',
    draw: 'The game is a draw.',
    thinking: 'Computer is thinking...',
    yourTurn: 'Your turn',
    computerTurn: "Computer's turn",
    toMove: 'to move',
    choosePromotion: 'Choose your promotion piece',
    cancel: 'Cancel',
    undo: 'Undo',
    flip: 'Flip Board',
    newGame: 'New Game',
    settings: 'GAME SETTINGS',
    playMode: 'Play mode',
    vsComputer: '🤖 vs Computer',
    twoPlayers: '👥 Two Players',
    playAs: 'Play as',
    whiteFirst: '⚪ White — move first',
    blackStarts: '⚫ Black — computer starts',
    difficulty: 'Computer difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    easyNote: 'Easy: relaxed play with more varied moves.',
    mediumNote: 'Medium: searches ahead and considers captures.',
    hardNote: 'Hard: searches deeper to find stronger moves.',
    history: 'MOVE HISTORY',
    emptyHistory: 'Your moves will appear here once the game begins.',
    strategy: 'STRATEGY TIP',
    strategyText: 'Control the center, develop your pieces, and protect your king.',
    computerError: 'The computer could not find a move. Please restart.',
    illegalMove: 'That move is not legal. Please choose another square.',
    whitePiece: 'white',
    blackPiece: 'black',
    pieceNames: {
      k: 'king',
      q: 'queen',
      r: 'rook',
      b: 'bishop',
      n: 'knight',
      p: 'pawn',
    },
  },

  zh: {
    eyebrow: 'NEXORA AI 游戏中心',
    title: '霓虹',
    titleAccent: '国际象棋',
    subtitle: '挑战电脑，规划每一步，掌控整个棋盘。',
    board: '国际象棋棋盘',
    white: '白方',
    black: '黑方',
    check: ' — 将军！',
    checkmate: '将死！',
    youWin: '你赢了！',
    computerWins: '电脑赢了。',
    stalemate: '和棋：逼和。',
    repetition: '和棋：三次重复局面。',
    insufficient: '和棋：棋子不足。',
    draw: '双方和棋。',
    thinking: '电脑正在思考...',
    yourTurn: '轮到你了',
    computerTurn: '轮到电脑了',
    toMove: '走棋',
    choosePromotion: '选择升变棋子',
    cancel: '取消',
    undo: '悔棋',
    flip: '翻转棋盘',
    newGame: '新游戏',
    settings: '游戏设置',
    playMode: '游戏模式',
    vsComputer: '🤖 对战电脑',
    twoPlayers: '👥 双人对战',
    playAs: '选择执棋方',
    whiteFirst: '⚪ 白方 — 先走',
    blackStarts: '⚫ 黑方 — 电脑先走',
    difficulty: '电脑难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    easyNote: '简单：电脑采用较轻松且变化更多的走法。',
    mediumNote: '中等：电脑会提前计算并考虑吃子。',
    hardNote: '困难：电脑会进行更深层的计算，寻找更强的走法。',
    history: '走棋记录',
    emptyHistory: '游戏开始后，你的走棋记录会显示在这里。',
    strategy: '策略提示',
    strategyText: '控制中心，发展棋子，并保护你的国王。',
    computerError: '电脑无法找到可行走法，请重新开始。',
    illegalMove: '这不是合法走法，请选择其他棋格。',
    whitePiece: '白方',
    blackPiece: '黑方',
    pieceNames: {
      k: '国王',
      q: '皇后',
      r: '城堡',
      b: '象',
      n: '马',
      p: '兵',
    },
  },
};

function normalizeLanguage(language) {
  return language === 'zh' || language === 'zh-CN' || language === 'zh-cn'
    ? 'zh'
    : 'en';
}

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

  const bestScore = scoredMoves[0].score;
  const equallyGood = scoredMoves.filter(
    (item) => item.score === bestScore,
  );

  return equallyGood[Math.floor(Math.random() * equallyGood.length)].move;
}

function getGameStatus(game, mode, playerColor, thinking, t) {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'b' : 'w';

    if (mode === 'computer') {
      return winner === playerColor
        ? `${t.checkmate} ${t.youWin}`
        : `${t.checkmate} ${t.computerWins}`;
    }

    return `${t.checkmate} ${winner === 'w' ? t.white : t.black} ${t.youWin}`;
  }

  if (game.isStalemate()) return t.stalemate;
  if (game.isThreefoldRepetition()) return t.repetition;
  if (game.isInsufficientMaterial()) return t.insufficient;
  if (game.isDraw()) return t.draw;

  if (thinking) return t.thinking;

  const sideToMove = game.turn() === 'w' ? t.white : t.black;
  const checkText = game.isCheck() ? t.check : '';

  if (mode === 'computer') {
    if (game.turn() === playerColor) {
      return `${t.yourTurn} (${sideToMove})${checkText}`;
    }

    return `${t.computerTurn} (${sideToMove})${checkText}`;
  }

  return `${sideToMove} ${t.toMove}${checkText}`;
}

export default function ChessGame({ language = 'en' }) {
  const lang = normalizeLanguage(language);
  const t = TEXT[lang];

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
        const botMove = chooseComputerMove(game, difficulty, botColor);

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
        setMessage(t.computerError);
      } finally {
        setThinking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [game, mode, playerColor, difficulty, botColor, gameOver, promotion, t]);

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
      setMessage(t.illegalMove);
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

  const status = getGameStatus(game, mode, playerColor, thinking, t);

  return (
    <section className="chess-game" id="chess-game">
      <div className="chess-heading">
        <span className="chess-eyebrow">{t.eyebrow}</span>
        <h2>
          {t.title} <span>{t.titleAccent}</span>
        </h2>
        <p>{t.subtitle}</p>
      </div>

      <div className="chess-layout">
        <div className="chess-board-panel">
          <div className="chess-status" aria-live="polite">
            <span className={game.isCheck() ? 'status-dot check' : 'status-dot'} />
            {status}
          </div>

          <div className="chess-board" role="group" aria-label={t.board}>
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

                const pieceDescription = piece
                  ? `${piece.color === 'w' ? t.whitePiece : t.blackPiece} ${t.pieceNames[piece.type]}`
                  : '';

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
                    aria-label={`${square}${pieceDescription ? ` ${pieceDescription}` : ''}`}
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
              <p>{t.choosePromotion}</p>

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
                  {t.cancel}
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
              ↶ {t.undo}
            </button>

            <button
              type="button"
              onClick={() => setFlipped((value) => !value)}
            >
              ⇅ {t.flip}
            </button>

            <button
              type="button"
              className="new-game-button"
              onClick={() => startNewGame()}
            >
              + {t.newGame}
            </button>
          </div>

          {message && <p className="chess-message">{message}</p>}
        </div>

        <aside className="chess-sidebar">
          <div className="chess-control-card">
            <h3>{t.settings}</h3>

            <label htmlFor="chess-mode">{t.playMode}</label>

            <select
              id="chess-mode"
              value={mode}
              onChange={(event) =>
                startNewGame(event.target.value, playerColor, difficulty)
              }
            >
              <option value="computer">{t.vsComputer}</option>
              <option value="local">{t.twoPlayers}</option>
            </select>

            {mode === 'computer' && (
              <>
                <label htmlFor="chess-color">{t.playAs}</label>

                <select
                  id="chess-color"
                  value={playerColor}
                  onChange={(event) =>
                    startNewGame(mode, event.target.value, difficulty)
                  }
                >
                  <option value="w">{t.whiteFirst}</option>
                  <option value="b">{t.blackStarts}</option>
                </select>

                <label htmlFor="chess-difficulty">{t.difficulty}</label>

                <select
                  id="chess-difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    startNewGame(mode, playerColor, event.target.value)
                  }
                >
                  <option value="Easy">{t.easy}</option>
                  <option value="Medium">{t.medium}</option>
                  <option value="Hard">{t.hard}</option>
                </select>

                <div className="difficulty-note">
                  <span className="difficulty-icon">✦</span>

                  <span>
                    {difficulty === 'Easy' && t.easyNote}
                    {difficulty === 'Medium' && t.mediumNote}
                    {difficulty === 'Hard' && t.hardNote}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="chess-control-card">
            <h3>{t.history}</h3>

            <div className="move-history">
              {history.length === 0 ? (
                <p className="history-empty">{t.emptyHistory}</p>
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
              <strong>{t.strategy}</strong>
              <p>{t.strategyText}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
