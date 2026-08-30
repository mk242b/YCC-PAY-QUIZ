import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function PlayerRemote() {
  const [view, setView] = useState<'login' | 'play' | 'gameover'>('login');
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const [timeLimitSec, setTimeLimitSec] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeRemaining > 0 && view === 'play') {
      interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining, view]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('round:player', (data: { question: string; choices: string[]; timeLimitSec: number }) => {
      setQuestion(data.question);
      setChoices(data.choices);
      setTimeLimitSec(data.timeLimitSec);
      setTimeRemaining(data.timeLimitSec);
      setDisabled(false);
      setSelectedIndex(null);
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
    <div className="min-h-screen bg-black text-[#0eba8e] font-sans flex flex-col items-center justify-center p-4">
      {view === 'login' && (
        <div className="w-full max-w-sm flex flex-col gap-6 bg-black border border-[#0eba8e] p-8 rounded-3xl animate-in zoom-in-95 duration-300">
          <h2 className="text-3xl font-bold text-center text-[#0eba8e]">Join Quiz</h2>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={15}
            className="w-full bg-black border-2 border-[#0eba8e]/50 rounded-xl px-4 py-4 text-xl text-center text-[#0eba8e] placeholder:text-[#0eba8e]/50 focus:border-[#0eba8e] focus:outline-none transition-colors"
          />
          <button
            onClick={handleJoin}
            className="w-full bg-black border-2 border-[#0eba8e] hover:bg-[#0eba8e] hover:text-black text-[#0eba8e] font-bold text-xl py-4 rounded-xl transition-all active:scale-95"
          >
            Connect & Ready
          </button>
        </div>
      )}

      {view === 'play' && (
        <div className="w-full max-w-sm flex flex-col gap-4 h-full py-8 animate-in fade-in">
          <div className="w-full h-2 bg-black border border-[#0eba8e] rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-[#0eba8e] transition-all duration-1000 ease-linear"
              style={{ width: `${timeLimitSec > 0 ? (timeRemaining / timeLimitSec) * 100 : 0}%` }}
            />
          </div>
          <div className="text-center font-mono text-xl font-bold mb-4">{timeRemaining}s</div>
          
          <h2 className="text-2xl font-bold text-center text-[#0eba8e] mb-4">{question}</h2>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {choices.map((choice, index) => {
              let btnClass = "bg-black border-[#0eba8e]/50 hover:bg-[#0eba8e]/20 text-[#0eba8e]";
              if (selectedIndex === index) {
                btnClass = "bg-black border-[#0eba8e] text-[#0eba8e] shadow-lg shadow-[#0eba8e]/20 bg-[#0eba8e]/10";
              }

              return (
                <button
                  key={index}
                  disabled={disabled}
                  onClick={() => handleAnswer(index)}
                  className={`w-full py-8 px-6 text-2xl font-bold border-2 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center ${btnClass} ${disabled && selectedIndex !== index ? 'opacity-50' : ''}`}
                >
                  {choice}
                </button>
              );
            })}
            
            {choices.length === 0 && (
              <div className="text-center text-[#0eba8e]/70 text-xl animate-pulse">
                Waiting for question...
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'gameover' && (
        <div className="w-full max-w-sm text-center bg-black border border-[#0eba8e] p-8 rounded-3xl animate-in zoom-in-95">
          <h2 className="text-3xl font-bold text-[#0eba8e] mb-4">Game Completed!</h2>
          <p className="text-[#0eba8e]/70 text-lg mb-8">Check the main screen for rankings.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-black border-2 border-[#0eba8e] hover:bg-[#0eba8e] hover:text-black text-[#0eba8e] font-bold text-xl py-4 rounded-xl transition-all active:scale-95"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
