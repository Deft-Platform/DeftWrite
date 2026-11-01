import { Zap, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const CIRCUMFERENCE = 2 * Math.PI * 15.5; // ~97.4

export function Header() {
  const {
    timeLeft, isRunning, isWork, workDuration, breakDuration, dailySessions, sessionStreak,
    activePersonaId, personas, togglePomodoro, resetPomodoro, openSettings, focusMode
  } = useApp();

  const persona = personas[activePersonaId];
  const duration = isWork ? workDuration : breakDuration;
  const progress = 1 - (timeLeft / duration);
  const offset = CIRCUMFERENCE * (1 - progress);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const ringColor = isWork ? '#6366f1' : '#10b981';

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <header className={`border-b glass flex items-center justify-between px-6 z-20 shrink-0 transition-all duration-300 ${focusMode ? 'bg-slate-950/95 backdrop-blur-xl' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 font-semibold tracking-tight">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>DEFTWRITE</span>
        </div>
        {/* Pomodoro */}
        <div className="ml-6 flex items-center gap-3">
          <svg width={focusMode ? 96 : 36} height={focusMode ? 96 : 36} viewBox="0 0 36 36" className={focusMode ? 'hidden' : ''}>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke={ringColor} strokeWidth="3"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          {focusMode && (
            <div className="flex flex-col items-center mr-4">
              <span className="text-6xl font-mono font-bold text-slate-200 tracking-wider">
                {formatTime(timeLeft)}
              </span>
              <span className={`text-sm mt-1 font-medium ${isWork ? 'text-indigo-400' : 'text-emerald-400'}`}>
                {isWork ? 'WORK SESSION' : 'BREAK'}
              </span>
              <span className="text-xs text-slate-600 mt-0.5">
                #{dailySessions + 1} · {sessionStreak}d streak
              </span>
            </div>
          )}
          <span className={`font-mono font-medium w-14 ${focusMode ? 'hidden' : ''}`}>
            {formatTime(timeLeft)}
          </span>
          <button
            onClick={togglePomodoro}
            className={`p-1.5 hover:bg-slate-700 rounded-md transition-colors ${focusMode ? 'bg-slate-800 px-3 py-2 gap-2 flex items-center' : ''}`}
            title={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {focusMode && <span className="text-sm font-medium">{isRunning ? 'Pause' : 'Start'}</span>}
          </button>
          {!focusMode && (
            <button
              onClick={resetPomodoro}
              className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!focusMode && dailySessions > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <span>{dailySessions} session{dailySessions !== 1 ? 's' : ''}</span>
          </div>
        )}
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
