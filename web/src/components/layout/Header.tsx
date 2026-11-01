import { Zap, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const CIRCUMFERENCE = 2 * Math.PI * 15.5; // ~97.4

export function Header() {
  const {
    pomodoro, activePersonaId, personas, togglePomodoro, resetPomodoro,
    openSettings, settingsOpen
  } = useApp();

  const persona = personas[activePersonaId];
  const progress = 1 - (pomodoro.timeLeft / (pomodoro.isWork ? 25 * 60 : 5 * 60));
  const offset = CIRCUMFERENCE * (1 - progress);
  const minutes = Math.floor(pomodoro.timeLeft / 60);
  const seconds = pomodoro.timeLeft % 60;
  const ringColor = pomodoro.isWork ? '#6366f1' : '#10b981';

  return (
    <header className="h-14 border-b border-slate-800 glass flex items-center justify-between px-6 z-20 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 font-semibold tracking-tight">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>DEFTWRITE</span>
        </div>
        {/* Pomodoro */}
        <div className="ml-6 flex items-center gap-3">
          <svg className="w-9 h-9" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke={ringColor} strokeWidth="3"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="pomodoro-ring"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <span className="text-lg font-mono font-medium text-slate-300 w-14">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <button
            onClick={togglePomodoro}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
          >
            {pomodoro.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={resetPomodoro}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 persona-active-indicator" />
          <span>{persona?.emoji} {persona?.name}</span>
        </div>
        <button
          onClick={openSettings}
          className="p-1.5 hover:bg-slate-700 rounded-full transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
