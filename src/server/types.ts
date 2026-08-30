export interface Question {
  id: number;
  question: string;
  choices: [string, string, string];
  correctIndex: number;
  timeLimitSec: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timestamp: string;
}
