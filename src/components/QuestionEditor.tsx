import { useState, useEffect, type FormEvent } from 'react';
import { Question } from '../server/types';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export function QuestionEditor() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState(['', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      setQuestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    setQuestions(newQuestions);

    try {
      await fetch('/api/questions/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: newQuestions })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          choices,
          correctIndex,
          timeLimitSec: timeLimit
        })
      });
      if (res.ok) {
        setStatus('Question added successfully!');
        setQuestionText('');
        setChoices(['', '', '']);
        setCorrectIndex(0);
        fetchQuestions();
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('Error adding question.');
      }
    } catch (e) {
      setStatus('Error adding question.');
    }
  };

  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  return (
    <div className="min-h-screen bg-black text-[#0eba8e] font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-[#0eba8e] pb-4">
          <h1 className="text-4xl font-bold">YCC Pay Questions Editor</h1>
          <a href="/host" className="text-xl font-bold underline hover:text-white transition-colors">Back to Host</a>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black border border-[#0eba8e] p-6 rounded-2xl h-fit">
            <h2 className="text-2xl font-semibold mb-6">Add New Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold">Question Text</label>
                <textarea 
                  required
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  className="w-full bg-black border border-[#0eba8e]/50 rounded p-3 text-[#0eba8e] focus:border-[#0eba8e] focus:outline-none placeholder:text-[#0eba8e]/30"
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-semibold">Answers (Select Correct Radio Button)</label>
                {choices.map((choice, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <input 
                      type="radio" 
                      name="correctIndex" 
                      checked={correctIndex === i}
                      onChange={() => setCorrectIndex(i)}
                      className="w-6 h-6 accent-[#0eba8e] cursor-pointer"
                    />
                    <input 
                      required
                      type="text"
                      value={choice}
                      onChange={e => updateChoice(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 bg-black border border-[#0eba8e]/50 rounded p-3 text-[#0eba8e] focus:border-[#0eba8e] focus:outline-none placeholder:text-[#0eba8e]/30"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block mb-2 font-semibold">Time Limit (Seconds)</label>
                <input 
                  type="number"
                  required
                  min={5}
                  max={120}
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="w-full bg-black border border-[#0eba8e]/50 rounded p-3 text-[#0eba8e] focus:border-[#0eba8e] focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-black border-2 border-[#0eba8e] hover:bg-[#0eba8e] hover:text-black text-[#0eba8e] font-bold text-xl py-4 rounded-xl transition-all active:scale-95 mt-4"
              >
                Add Question
              </button>
              {status && <p className="mt-4 text-center font-bold">{status}</p>}
            </form>
          </div>

          <div className="bg-black border border-[#0eba8e] p-6 rounded-2xl flex flex-col h-[700px]">
            <h2 className="text-2xl font-semibold mb-6">Existing Questions ({questions.length})</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border border-[#0eba8e]/30 rounded-lg relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-1 text-[#0eba8e]/70 hover:text-[#0eba8e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ArrowUp size={20} /></button>
                    <button onClick={() => handleMove(idx, 'down')} disabled={idx === questions.length - 1} className="p-1 text-[#0eba8e]/70 hover:text-[#0eba8e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ArrowDown size={20} /></button>
                    <button onClick={() => handleDelete(q.id)} className="p-1 text-red-500/70 hover:text-red-500 ml-2 transition-colors"><Trash2 size={20} /></button>
                  </div>
                  <p className="font-bold mb-3 text-lg pr-24">{idx + 1}. {q.question}</p>
                  <ul className="text-base space-y-2">
                    {q.choices.map((c, i) => (
                      <li key={i} className={i === q.correctIndex ? 'text-green-400 font-bold flex items-center gap-2' : 'text-[#0eba8e]/70 flex items-center gap-2'}>
                        <span className="w-6 h-6 flex items-center justify-center border border-current rounded-full text-xs">
                          {String.fromCharCode(65 + i)}
                        </span> 
                        {c} 
                        {i === q.correctIndex && <span className="text-green-400">✓ Correct</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-[#0eba8e]/50 mt-4 border-t border-[#0eba8e]/20 pt-2">Time limit: {q.timeLimitSec}s</p>
                </div>
              ))}
              {questions.length === 0 && <p className="text-[#0eba8e]/50 text-center mt-10">No questions added yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
