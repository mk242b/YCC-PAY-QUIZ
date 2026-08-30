import fs from 'fs';
import path from 'path';
import { Question, LeaderboardEntry } from './types';

const QUESTIONS_PATH = path.join(process.cwd(), 'data/questions.json');
const LEADERBOARD_PATH = path.join(process.cwd(), 'data/leaderboard.json');

export function loadQuestions(): Question[] {
  if (!fs.existsSync(QUESTIONS_PATH)) return [];
  const raw = fs.readFileSync(QUESTIONS_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function loadLeaderboard(): LeaderboardEntry[] {
  if (!fs.existsSync(LEADERBOARD_PATH)) return [];
  const raw = fs.readFileSync(LEADERBOARD_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function saveLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const list = loadLeaderboard();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  if (!fs.existsSync(path.dirname(LEADERBOARD_PATH))) {
    fs.mkdirSync(path.dirname(LEADERBOARD_PATH), { recursive: true });
  }
  fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(list, null, 2), 'utf-8');
  return list;
}
