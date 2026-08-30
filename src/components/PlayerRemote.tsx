import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function PlayerRemote() {
  const [view, setView] = useState<'login' | 'play' | 'gameover'>('login');
  const [name, setName] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('round:player', (data: { choices: string[] }) => {
      setChoices(data.choices);
      setDisabled(false);
      setSelectedIndex(null);
      setCorrectIndex(null);
    });

    socket.on('round:result', (data: { isCorrect: boolean; correctIndex: number }) => {
      setCorrectIndex(data.correctIndex);
    });

    socket.on('game:over', () => {
      setView('gameover');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    socketRef.current?.emit('player:join', { name: name.trim() });
    setView('play');
  };

  const handleAnswer = (index: number) => {
    if (disabled) return;
    setDisabled(true);
    setSelectedIndex(index);
    socketRef.current?.emit('answer:submit', { choiceIndex: index });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-4">
      {view === 'login' && (
        <div className="w-full max-w-sm flex flex-col gap-6 bg-slate-900 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
          <h2 className="text-3xl font-bold text-center text-blue-400">Join Quiz</h2>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={15}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-xl text-center focus:border-blue-500 focus:outline-none transition-colors"
          />
          <button
            onClick={handleJoin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-4 rounded-xl transition-transform active:scale-95 shadow-lg shadow-blue-900/50"
          >
            Connect & Ready
          </button>
        </div>
      )}

      {view === 'play' && (
        <div className="w-full max-w-sm flex flex-col gap-4 h-full py-8 animate-in fade-in">
          <div className="flex-1 flex flex-col justify-center gap-4">
            {choices.map((choice, index) => {
              let btnClass = "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white";
              if (correctIndex !== null) {
                if (index === correctIndex) {
                  btnClass = "bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50";
                } else if (index === selectedIndex) {
                  btnClass = "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/50";
                } else {
                  btnClass = "bg-slate-900 border-slate-800 text-slate-500 opacity-50";
                }
              } else if (selectedIndex === index) {
                btnClass = "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50";
              }

              return (
                <button
                  key={index}
                  disabled={disabled}
                  onClick={() => handleAnswer(index)}
                  className={`w-full py-8 px-6 text-2xl font-bold border-2 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center ${btnClass} ${disabled && correctIndex === null && selectedIndex !== index ? 'opacity-50' : ''}`}
                >
                  {choice}
                </button>
              );
            })}
            
            {choices.length === 0 && (
              <div className="text-center text-slate-500 text-xl animate-pulse">
                Waiting for question...
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'gameover' && (
        <div className="w-full max-w-sm text-center bg-slate-900 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95">
          <h2 className="text-3xl font-bold text-blue-400 mb-4">Game Completed!</h2>
          <p className="text-slate-300 text-lg mb-8">Check the main screen for rankings.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl py-4 rounded-xl transition-transform active:scale-95"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
