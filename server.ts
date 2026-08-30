import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import os from 'os';
import { loadQuestions, loadLeaderboard, saveLeaderboardEntry } from './src/server/storage.js';
import { Question, LeaderboardEntry } from './src/server/types.js';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });
  const PORT = 3000;

  let questions: Question[] = [];
  let currentQuestionIndex = 0;
  let currentPlayerName = '';
  let currentScore = 0;
  let correctCount = 0;
  let roundTimer: NodeJS.Timeout | null = null;
  let roundStartTime = 0;

  function getLocalIp(): string {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) return net.address;
      }
    }
    return 'localhost';
  }

  function startRound() {
    if (currentQuestionIndex >= questions.length) {
      const entry: LeaderboardEntry = {
        name: currentPlayerName,
        score: currentScore,
        correctCount,
        totalQuestions: questions.length,
        timestamp: new Date().toISOString()
      };
      const updatedLeaderboard = saveLeaderboardEntry(entry);
      io.emit('game:over', { finalScore: currentScore, leaderboard: updatedLeaderboard });
      return;
    }

    const q = questions[currentQuestionIndex];
    roundStartTime = Date.now();

    io.emit('round:host', {
      id: q.id,
      question: q.question,
      current: currentQuestionIndex + 1,
      total: questions.length,
      timeLimitSec: q.timeLimitSec
    });

    io.emit('round:player', {
      choices: q.choices,
      timeLimitSec: q.timeLimitSec
    });

    if (roundTimer) clearTimeout(roundTimer);
    roundTimer = setTimeout(() => {
      handleAnswer(-1); // Timeout
    }, q.timeLimitSec * 1000);
  }

  function handleAnswer(choiceIndex: number) {
    if (roundTimer) {
      clearTimeout(roundTimer);
      roundTimer = null;
    }
    
    if (currentQuestionIndex >= questions.length) return;

    const q = questions[currentQuestionIndex];
    const elapsedSec = (Date.now() - roundStartTime) / 1000;
    const remainingSec = Math.max(0, q.timeLimitSec - elapsedSec);
    const isCorrect = choiceIndex === q.correctIndex;
    
    let points = 0;
    if (isCorrect) {
      points = Math.round(1000 + (remainingSec / q.timeLimitSec) * 1000);
      currentScore += points;
      correctCount++;
    }

    io.emit('round:result', {
      isCorrect,
      correctIndex: q.correctIndex,
      pointsAwarded: points,
      totalScore: currentScore
    });

    currentQuestionIndex++;
    setTimeout(startRound, 3000);
  }

  io.on('connection', (socket) => {
    socket.emit('host:init', {
      leaderboard: loadLeaderboard(),
      lanIp: getLocalIp(),
      port: PORT
    });

    socket.on('player:join', (data: { name: string }) => {
      currentPlayerName = data.name.trim() || 'Player 1';
      currentScore = 0;
      correctCount = 0;
      currentQuestionIndex = 0;
      questions = loadQuestions();

      io.emit('game:ready', { playerName: currentPlayerName, totalQuestions: questions.length });
      setTimeout(startRound, 2000);
    });

    socket.on('answer:submit', (data: { choiceIndex: number }) => {
      handleAnswer(data.choiceIndex);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const IP = getLocalIp();
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiz Server Online:`);
    console.log(`- Host Screen: http://localhost:${PORT}/host`);
    console.log(`- Player Device: http://${IP}:${PORT}/player`);
  });
}

startServer();
