import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { LeaderboardEntry } from '../server/types';

export function HostDisplay() {
  const [view, setView] = useState<'lobby' | 'game' | 'gameover'>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [statusText, setStatusText] = useState('Waiting for player to connect...');
  
  const [question, setQuestion] = useState('');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLimitSec, setTimeLimitSec] = useState(0);
  
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [timerWidth, setTimerWidth] = useState('100%');
  const [timerTransition, setTimerTransition] = useState('none');
  
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('game:ready', (data: { playerName: string }) => {
      setPlayerName(data.playerName);
      setStatusText(`Player ${data.playerName} ready! Starting...`);
      setTimeout(() => setView('game'), 2000);
    });

    socket.on('round:host', (data: { question: string; current: number; total: number; timeLimitSec: number }) => {
      setFeedback({ text: '', type: '' });
      setCurrent(data.current);
      setTotal(data.total);
      setQuestion(data.question);
      setTimeLimitSec(data.timeLimitSec);
      
      setTimerTransition('none');
      setTimerWidth('100%');
      
      setTimeout(() => {
        setTimerTransition(`width ${data.timeLimitSec}s linear`);
        setTimerWidth('0%');
      }, 50);
    });

    socket.on('round:result', (data: { isCorrect: boolean; pointsAwarded: number; totalScore: number }) => {
      setScore(data.totalScore);
      setFeedback({
        text: data.isCorrect ? `Correct! +${data.pointsAwarded} pts` : `Incorrect / Timeout! +0 pts`,
        type: data.isCorrect ? 'correct' : 'incorrect'
      });
      setTimerTransition('none');
      setTimerWidth('0%');
    });

    socket.on('game:over', (data: { finalScore: number; leaderboard: LeaderboardEntry[] }) => {
      setFinalScore(data.finalScore);
      setLeaderboard(data.leaderboard);
      setView('gameover');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden flex items-center justify-center">
      {view === 'lobby' && (
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <h1 className="text-5xl font-bold mb-6 text-blue-400">Quiz Arena Host</h1>
          <p className="text-xl text-slate-300 mb-8">
            Scan or open: <span className="font-mono bg-slate-800 px-3 py-1 rounded text-green-400">{window.location.origin}/player</span>
          </p>
          <div className="text-2xl font-semibold animate-pulse text-amber-300">
            {statusText}
          </div>
        </div>
      )}

      {view === 'game' && (
        <div className="w-full max-w-5xl px-8 flex flex-col h-screen py-12 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-between items-center mb-12 text-2xl font-bold bg-slate-800 p-6 rounded-2xl shadow-xl">
            <span className="text-slate-300">Question {current}/{total}</span>
            <span className="text-blue-400">Score: {score}</span>
          </div>
          
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden mb-16 shadow-inner">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: timerWidth, transition: timerTransition }}
            />
          </div>
          
          <h2 className="text-5xl font-bold text-center leading-tight mb-auto text-white shadow-sm">
            {question || 'Loading...'}
          </h2>
          
          <div className="h-24 mt-8 flex items-center justify-center">
            {feedback.text && (
              <div className={`text-4xl font-bold animate-in slide-in-from-bottom-8 fade-in ${feedback.type === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                {feedback.text}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'gameover' && (
        <div className="w-full max-w-4xl text-center animate-in fade-in slide-in-from-bottom-12 duration-700">
          <h1 className="text-6xl font-bold mb-4 text-blue-400">Match Concluded!</h1>
          <h2 className="text-4xl text-white mb-12">Final Score: {finalScore} pts</h2>
          
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl inline-block w-full max-w-2xl text-left">
            <h3 className="text-2xl text-slate-400 font-semibold mb-6 uppercase tracking-wider border-b border-slate-700 pb-4">Hall of Fame</h3>
            <div className="space-y-4">
              {leaderboard.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xl p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors">
                  <span className="font-bold">
                    <span className="text-slate-400 mr-4">#{idx + 1}</span>
                    <span className="text-white">{item.name}</span>
                  </span>
                  <span className="font-mono text-green-400">{item.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
