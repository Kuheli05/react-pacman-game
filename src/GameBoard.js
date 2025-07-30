import React, { useEffect, useState } from 'react';
import './index.css';

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;
const WALL = '#';
const FLOOR = '.';

function generateMaze() {
  const board = Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => (Math.random() < 0.2 ? WALL : FLOOR))
  );

  // Ensure outer boundaries are walls
  for (let i = 0; i < BOARD_HEIGHT; i++) {
    board[i][0] = WALL;
    board[i][BOARD_WIDTH - 1] = WALL;
  }
  for (let j = 0; j < BOARD_WIDTH; j++) {
    board[0][j] = WALL;
    board[BOARD_HEIGHT - 1][j] = WALL;
  }

  // Ensure PacMan starting area is open
  board[1][1] = FLOOR;
  board[1][2] = FLOOR;
  board[2][1] = FLOOR;

  return board;
}

function GameBoard() {
  const [board, setBoard] = useState(generateMaze);
  const [pacman, setPacman] = useState({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState([{ x: 5, y: 5 }]);
  const [powerPellets, setPowerPellets] = useState([{ x: 10, y: 10 }]);
  const [poweredUp, setPoweredUp] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    const handleKeyDown = (e) => {
      setPacman((prev) => {
        let { x, y } = prev;
        if (e.key === 'ArrowUp' && board[y - 1][x] !== WALL) y -= 1;
        if (e.key === 'ArrowDown' && board[y + 1][x] !== WALL) y += 1;
        if (e.key === 'ArrowLeft' && board[y][x - 1] !== WALL) x -= 1;
        if (e.key === 'ArrowRight' && board[y][x + 1] !== WALL) x += 1;

        // Power pellet collision
        const pelletIndex = powerPellets.findIndex(p => p.x === x && p.y === y);
        if (pelletIndex > -1) {
          setPoweredUp(true);
          setPowerPellets(p => p.filter((_, i) => i !== pelletIndex));
          setTimeout(() => setPoweredUp(false), 5000);
        }

        return { x, y };
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [powerPellets, board]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGhosts((prevGhosts) => {
        return prevGhosts.map((ghost) => {
          const dx = pacman.x - ghost.x;
          const dy = pacman.y - ghost.y;

          const moves = [];
          if (ghost.y > 0 && board[ghost.y - 1][ghost.x] !== WALL) moves.push({ x: ghost.x, y: ghost.y - 1 });
          if (ghost.y < BOARD_HEIGHT - 1 && board[ghost.y + 1][ghost.x] !== WALL) moves.push({ x: ghost.x, y: ghost.y + 1 });
          if (ghost.x > 0 && board[ghost.y][ghost.x - 1] !== WALL) moves.push({ x: ghost.x - 1, y: ghost.y });
          if (ghost.x < BOARD_WIDTH - 1 && board[ghost.y][ghost.x + 1] !== WALL) moves.push({ x: ghost.x + 1, y: ghost.y });

          let bestMove = ghost;
          let minDist = Infinity;
          for (const move of moves) {
            const dist = Math.abs(move.x - pacman.x) + Math.abs(move.y - pacman.y);
            if (dist < minDist) {
              minDist = dist;
              bestMove = move;
            }
          }

          if (bestMove.x === pacman.x && bestMove.y === pacman.y) {
            if (poweredUp) {
              setScore((s) => s + 100);
              return null; // Ghost defeated
            } else {
              setLives((l) => l - 1);
              if (lives - 1 <= 0) setGameOver(true);
              setPacman({ x: 1, y: 1 });
              return ghost;
            }
          }

          return bestMove;
        }).filter(Boolean);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [pacman, poweredUp, board, lives]);

  useEffect(() => {
    if (ghosts.length === 0 && !gameOver) {
      // Advance to next level
      const newLevel = level + 1;
      setLevel(newLevel);
      setBoard(generateMaze());
      setPacman({ x: 1, y: 1 });
      setGhosts(Array.from({ length: newLevel }, (_, i) => ({ x: 5 + i, y: 5 })));
      setPowerPellets(Array.from({ length: newLevel }, () => ({
        x: Math.floor(Math.random() * (BOARD_WIDTH - 2)) + 1,
        y: Math.floor(Math.random() * (BOARD_HEIGHT - 2)) + 1,
      })));
    }
  }, [ghosts, gameOver, level]);

  const resetGame = () => {
    setBoard(generateMaze());
    setPacman({ x: 1, y: 1 });
    setGhosts([{ x: 5, y: 5 }]);
    setPowerPellets([{ x: 10, y: 10 }]);
    setPoweredUp(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLives(3);
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <strong>Score:</strong> {score} | <strong>Level:</strong> {level} | <strong>Lives:</strong> {lives}
      </div>
      {gameOver ? (
        <div>
          <h2 style={{ color: 'red' }}>Game Over!</h2>
          <button onClick={resetGame}>Restart</button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 20px)`
          }}
        >
          {board.map((row, y) =>
            row.map((cell, x) => {
              const isPacman = pacman.x === x && pacman.y === y;
              const isGhost = ghosts.some(g => g.x === x && g.y === y);
              const isPellet = powerPellets.some(p => p.x === x && p.y === y);
              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: isPacman
                      ? 'yellow'
                      : isGhost
                      ? poweredUp ? 'blue' : 'red'
                      : isPellet
                      ? 'white'
                      : cell === WALL
                      ? 'gray'
                      : 'black',
                    border: '1px solid #333'
                  }}
                ></div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default GameBoard;
