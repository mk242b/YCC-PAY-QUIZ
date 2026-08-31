import fs from 'fs';
import path from 'path';
import { Question, LeaderboardEntry } from './types';

const QUESTIONS_PATH = path.join(process.cwd(), 'data/questions.json');
const LEADERBOARD_PATH = path.join(process.cwd(), 'data/leaderboard.json');

export function loadQuestions(): Question[] {
  if (!fs.existsSync(QUESTIONS_PATH)) return [];
  const raw = fs.readFileSync(QUESTIONS_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  if (!fs.existsSync(LEADERBOARD_PATH)) return [];
  const raw = fs.readFileSync(LEADERBOARD_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
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

export function saveQuestions(questions: Question[]) {
  if (!fs.existsSync(path.dirname(QUESTIONS_PATH))) {
    fs.mkdirSync(path.dirname(QUESTIONS_PATH), { recursive: true });
  }
  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
}

export function addQuestion(qData: Omit<Question, 'id'>): Question {
  const list = loadQuestions();
  const nextId = list.length > 0 ? Math.max(...list.map(q => q.id)) + 1 : 1;
  const newQ: Question = { ...qData, id: nextId };
  list.push(newQ);
  saveQuestions(list);
  return newQ;
}
