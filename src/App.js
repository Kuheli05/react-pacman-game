import React, { useState } from 'react';
import GameBoard from './GameBoard';

function App() {
  const [start, setStart] = useState(false);

  return (
    <div>
      {start ? (
        <GameBoard />
      ) : (
        <button onClick={() => setStart(true)}>Start Game</button>
      )}
    </div>
  );
}

export default App;