import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { LeaderboardEntry } from '../server/types';

export function HostDisplay() {
  const [view, setView] = useState<'lobby' | 'game' | 'gameover'>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [statusText, setStatusText] = useState('Waiting for player to connect...');
  const [joinUrl, setJoinUrl] = useState('');
  
  const [question, setQuestion] = useState('');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLimitSec, setTimeLimitSec] = useState(0);
  
  const [score, setScore] = useState(0);
  const [timerWidth, setTimerWidth] = useState('100%');
  const [timerTransition, setTimerTransition] = useState('none');
  
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('host:init', (data: { leaderboard: LeaderboardEntry[]; lanIp: string; port: number }) => {
      setLeaderboard(data.leaderboard);
      const url = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? `http://${data.lanIp}:${data.port}/player`
          : `${window.location.origin}/player`;
      setJoinUrl(url);
    });

    socket.on('game:ready', (data: { playerName: string }) => {
      setPlayerName(data.playerName);
      setStatusText(`Player ${data.playerName} ready! Starting...`);
      setTimeout(() => setView('game'), 2000);
    });

    socket.on('round:host', (data: { question: string; current: number; total: number; timeLimitSec: number; currentScore: number }) => {
      setCurrent(data.current);
      setTotal(data.total);
      setQuestion(data.question);
      setTimeLimitSec(data.timeLimitSec);
      setScore(data.currentScore);
      
      setTimerTransition('none');
      setTimerWidth('100%');
      
      setTimeout(() => {
        setTimerTransition(`width ${data.timeLimitSec}s linear`);
        setTimerWidth('0%');
      }, 50);
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
    <div className="min-h-screen bg-black text-[#0eba8e] font-sans overflow-hidden flex items-center justify-center">
      {view === 'lobby' && (
        <div className="w-full max-w-4xl text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 py-12">
          <h1 className="text-5xl font-bold mb-8 text-[#0eba8e]">YCC Pay Quiz</h1>
          
          <div className="flex flex-row gap-12 w-full justify-center items-start mt-4">
            <div className="flex flex-col items-center bg-black border border-[#0eba8e] p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">Scan to Join</h2>
              <div className="bg-white p-4 rounded-lg mb-6">
                <QRCodeSVG value={joinUrl || window.location.origin + '/player'} size={200} fgColor="#000000" bgColor="#ffffff" />
              </div>
              <p className="text-lg mb-2">Or open link:</p>
              <span className="font-mono bg-black border border-[#0eba8e] px-4 py-2 rounded text-[#0eba8e] select-all">{joinUrl || 'Loading...'}</span>
              <div className="text-xl font-semibold animate-pulse text-[#0eba8e] mt-8">
                {statusText}
              </div>
            </div>

            {leaderboard.length > 0 && (
              <div className="bg-black border border-[#0eba8e] p-8 rounded-2xl w-full max-w-md text-left">
                <h3 className="text-2xl font-semibold mb-6 uppercase tracking-wider border-b border-[#0eba8e] pb-4">Hall of Fame</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {leaderboard.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-lg p-3 bg-black border border-[#0eba8e]/30 rounded-xl hover:bg-[#0eba8e]/10 transition-colors">
                      <span className="font-bold">
                        <span className="text-[#0eba8e]/70 mr-3">#{idx + 1}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="font-mono">{item.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'game' && (
        <div className="w-full max-w-5xl px-8 flex flex-col h-screen py-12 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-between items-center mb-12 text-2xl font-bold bg-black border border-[#0eba8e] p-6 rounded-2xl">
            <span>Question {current}/{total}</span>
            <span>Score: {score}</span>
          </div>
          
          <div className="w-full h-4 bg-black border border-[#0eba8e] rounded-full overflow-hidden mb-16">
            <div 
              className="h-full bg-[#0eba8e]" 
              style={{ width: timerWidth, transition: timerTransition }}
            />
          </div>
          
          <h2 className="text-5xl font-bold text-center leading-tight mb-auto shadow-sm">
            {question || 'Loading...'}
          </h2>
        </div>
      )}

      {view === 'gameover' && (
        <div className="w-full max-w-4xl text-center animate-in fade-in slide-in-from-bottom-12 duration-700">
          <h1 className="text-6xl font-bold mb-4">Match Concluded!</h1>
          <h2 className="text-4xl mb-12">Final Score: {finalScore} pts</h2>
          
          <div className="bg-black border border-[#0eba8e] p-8 rounded-3xl inline-block w-full max-w-2xl text-left">
            <h3 className="text-2xl font-semibold mb-6 uppercase tracking-wider border-b border-[#0eba8e] pb-4">Hall of Fame</h3>
            <div className="space-y-4">
              {leaderboard.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xl p-4 bg-black border border-[#0eba8e]/30 rounded-xl hover:bg-[#0eba8e]/10 transition-colors">
                  <span className="font-bold">
                    <span className="text-[#0eba8e]/70 mr-4">#{idx + 1}</span>
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono">{item.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
