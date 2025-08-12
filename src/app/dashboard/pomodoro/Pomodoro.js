'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaRedo, FaCheck } from 'react-icons/fa';
import { IoMdSettings } from 'react-icons/io';
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { updateTask, addTask } from '../../api/note-api';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { useRouter } from 'next/navigation';

// Stable SettingsPanel component to avoid remount on each parent render
function SettingsPanel({ settings, onSave, isLoading }) {
  const [local, setLocal] = useState({
    pomodoro: String(settings.pomodoro ?? 25),
    shortBreak: String(settings.shortBreak ?? 5),
    longBreak: String(settings.longBreak ?? 15),
    longBreakInterval: String(settings.longBreakInterval ?? 4),
    autoStartBreaks: Boolean(settings.autoStartBreaks ?? false),
    autoStartPomodoros: Boolean(settings.autoStartPomodoros ?? false),
  });

  useEffect(() => {
    setLocal({
      pomodoro: String(settings.pomodoro ?? 25),
      shortBreak: String(settings.shortBreak ?? 5),
      longBreak: String(settings.longBreak ?? 15),
      longBreakInterval: String(settings.longBreakInterval ?? 4),
      autoStartBreaks: Boolean(settings.autoStartBreaks ?? false),
      autoStartPomodoros: Boolean(settings.autoStartPomodoros ?? false),
    });
  }, [settings]);

  const clamp = (n, min, max, fallback) => {
    if (Number.isNaN(n) || n === null) return fallback;
    return Math.max(min, Math.min(max, n));
  };

  const handleSave = () => {
    const next = {
      pomodoro: clamp(parseInt(local.pomodoro, 10), 1, 60, 25),
      shortBreak: clamp(parseInt(local.shortBreak, 10), 1, 30, 5),
      longBreak: clamp(parseInt(local.longBreak, 10), 1, 60, 15),
      longBreakInterval: clamp(parseInt(local.longBreakInterval, 10), 1, 10, 4),
      autoStartBreaks: !!local.autoStartBreaks,
      autoStartPomodoros: !!local.autoStartPomodoros,
    };
    onSave(next);
  };

  const onNumericChange = (key) => (e) => {
    let v = e.target.value || '';
    // keep only digits
    v = v.replace(/[^0-9]/g, '');
    // remove leading zeros like '09' -> '9'
    if (v.length > 1) v = v.replace(/^0+/, '');
    setLocal(prev => ({ ...prev, [key]: v }));
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-[#A23E48] mb-4">Timer Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pomodoro (minutes)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={local.pomodoro}
            onChange={onNumericChange('pomodoro')}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-[#A23E48] focus:border-[#A23E48] transition-all duration-300 ease-in-out"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Break (minutes)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={local.shortBreak}
            onChange={onNumericChange('shortBreak')}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-[#A23E48] focus:border-[#A23E48] transition-all duration-300 ease-in-out"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Long Break (minutes)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={local.longBreak}
            onChange={onNumericChange('longBreak')}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-[#A23E48] focus:border-[#A23E48] transition-all duration-300 ease-in-out"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Long Break Interval</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={local.longBreakInterval}
            onChange={onNumericChange('longBreakInterval')}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-[#A23E48] focus:border-[#A23E48] transition-all duration-300 ease-in-out"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoStartBreaks"
            checked={local.autoStartBreaks}
            onChange={e => setLocal(prev => ({ ...prev, autoStartBreaks: e.target.checked }))}
            className="hover:cursor-pointer h-4 w-4 text-[#A23E48] focus:ring-[#A23E48]"
          />
          <label htmlFor="autoStartBreaks" className="ml-2 block text-sm text-gray-700">
            Auto-start Breaks
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoStartPomodoros"
            checked={local.autoStartPomodoros}
            onChange={e => setLocal(prev => ({ ...prev, autoStartPomodoros: e.target.checked }))}
            className="hover:cursor-pointer h-4 w-4 text-[#A23E48] focus:ring-[#A23E48]"
          />
          <label htmlFor="autoStartPomodoros" className="ml-2 block text-sm text-gray-700">
            Auto-start Pomodoros
          </label>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          className="hover:cursor-pointer px-4 py-2 bg-[#A23E48] text-white rounded-md hover:bg-[#8e3640] transition-colors"
          onClick={handleSave}
          disabled={isLoading}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

// PomodoroTimer: client-only timer + task selector (today's tasks only)
const PomodoroTimer = ({ tasks = [], isLoading: _pageLoading = false, userId }) => {
  const router = useRouter();
  const [ isLoading, setIsLoading] = useState(false);
  
  // Timer states
  const [mode, setMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(() => {
    // Initialize from saved settings to avoid defaulting to 25:00 on reload
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('pomodoroSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          const init = Number(parsed?.pomodoro);
          if (!Number.isNaN(init) && init > 0) return init * 60;
        }
      }
    } catch {}
    return 25 * 60;
  }); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const runningRef = useRef(false); // decouple running guard from re-render
  const [cycles, setCycles] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Task states (derived from props)
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  // Add task states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  
  // Settings
  const [settings, setSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4
  });
  
  // References
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  // Initialize audio with diagnostics + fallback beep
  useEffect(() => {
    const AUDIO_PATH = '/sounds/notification.mp3';
    try {
      const el = new Audio();
      el.src = AUDIO_PATH;
      el.preload = 'auto';
      // Better diagnostics
      const logMediaError = () => {
        const mediaErr = el.error;
        if (mediaErr) {
          const codes = ['MEDIA_ERR_CUSTOM','MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED','MEDIA_ERR_ENCRYPTED'];
          console.error('[PomodoroAudio] Load error', {
            code: mediaErr.code,
            codeLabel: codes[mediaErr.code] || 'UNKNOWN',
            message: mediaErr.message
          });
        } else {
          console.error('[PomodoroAudio] Unknown audio load error (no mediaErr)');
        }
      };
      el.addEventListener('error', logMediaError);
      el.addEventListener('canplaythrough', () => {
        // console.debug('[PomodoroAudio] Audio ready');
      }, { once: true });
      audioRef.current = el;
    } catch (error) {
      console.warn('[PomodoroAudio] Audio not supported by browser, will use Web Audio beep fallback:', error);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const playFallbackBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880; // A5
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.72);
    } catch (e) {
      console.error('[PomodoroAudio] Fallback beep failed', e);
    }
  }, []);
  
  // Handle timer completion (placed before startTimer to avoid TDZ issues)
  const handleTimerComplete = useCallback(() => {
    let attemptedPlay = false;
    try {
      if (audioRef.current) {
        const p = audioRef.current.play();
        attemptedPlay = true;
        if (p && typeof p.then === 'function') {
          p.catch(err => {
            console.warn('[PomodoroAudio] Playback blocked, using fallback beep', err?.name || err);
            playFallbackBeep();
          });
        }
      }
    } catch (error) {
      console.error("Couldn't play notification sound, using fallback beep:", error);
      playFallbackBeep();
    }
    if (!attemptedPlay) {
      playFallbackBeep();
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`${mode === 'pomodoro' ? 'Time to take a break!' : 'Break finished!'}`, {
        body: `${mode === 'pomodoro' ? 'Good job focusing!' : 'Ready to focus again?'}`,
        icon: '/favicon.ico'
      });
    }
    if (mode === 'pomodoro') {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      if (newCycles % settings.longBreakInterval === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('pomodoro');
    }
  }, [mode, cycles, settings.longBreakInterval, playFallbackBeep]);

  const startTimer = useCallback(() => {
    if (runningRef.current) return; // already running
    runningRef.current = true;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          runningRef.current = false;
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleTimerComplete]);

  // Update timer when mode/settings change
  useEffect(() => {
    switch(mode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoro * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
    setIsRunning(false);
    runningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    if ((mode === 'shortBreak' || mode === 'longBreak') && settings.autoStartBreaks) {
      startTimer();
    } else if (mode === 'pomodoro' && settings.autoStartPomodoros && cycles > 0) {
      startTimer();
    }
  }, [mode, settings.pomodoro, settings.shortBreak, settings.longBreak, settings.autoStartBreaks, settings.autoStartPomodoros, cycles]);
  
  // (handleTimerComplete moved above startTimer)
  
  // Timer control helpers
  
  const pauseTimer = () => {
    setIsRunning(false);
  runningRef.current = false;
    clearInterval(timerRef.current);
  };
  
  const resetTimer = () => {
    pauseTimer();
    switch(mode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoro * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
  };
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };
  
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load settings from localStorage on mount (optional persistence)
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('pomodoroSettings') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Failed to load saved settings:', e);
    }
  }, []);

  // Derive today's tasks from page props when they change
  useEffect(() => {
    const todays = (Array.isArray(tasks) ? tasks : []).filter(t => (t?.date === 'today') || !('date' in t));
    setAvailableTasks(todays);
  }, [tasks]);

  const handleOpenAdd = () => {
    setNewTitle('');
    setNewDescription('');
    setAddError('');
    setShowAddModal(true);
  };

  const handleAddTask = async (e) => {
    e?.preventDefault();
    if (!userId) {
      setAddError('Not authenticated');
      return;
    }
    if (!newTitle.trim()) {
      setAddError('Title required');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const created = await addTask(userId, { title: newTitle.trim(), description: newDescription.trim(), date: 'today' });
      setAvailableTasks(prev => [...prev, { ...created, isFinished: false, rank: (prev.length || 0) + 1 }]);
      setShowAddModal(false);
      // Auto-select newly added task for focus
      setSelectedTaskId(created.id);
    } catch (err) {
      console.error('Failed to add task', err);
      setAddError('Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  // Save settings and finish loading state
  const handleSaveSettings = async (nextSettings) => {
    try {
      setIsLoading(true);
      // Apply new settings immediately
      if (nextSettings) {
        setSettings(nextSettings);
      }
      const toPersist = nextSettings ?? settings;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pomodoroSettings', JSON.stringify(toPersist));
      }
      // Reset timer immediately based on current mode and new settings
      switch (mode) {
        case 'pomodoro':
          setTimeLeft((nextSettings?.pomodoro ?? settings.pomodoro) * 60);
          break;
        case 'shortBreak':
          setTimeLeft((nextSettings?.shortBreak ?? settings.shortBreak) * 60);
          break;
        case 'longBreak':
          setTimeLeft((nextSettings?.longBreak ?? settings.longBreak) * 60);
          break;
      }
      // Optional: small delay to show feedback
      await new Promise(r => setTimeout(r, 300));
      setShowSettings(false);
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  // Handle task completion
  const handleTaskCompletion = async () => {
    if (selectedTaskId) {
      try {
        setCompletingId(selectedTaskId);
        await updateTask(selectedTaskId, { isFinished: true });
        // Update local state so the finished task stays but moves to bottom (sorted in render)
        setAvailableTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === selectedTaskId ? { ...task, isFinished: true } : task
          )
        );
        setSelectedTaskId(null);
      } catch (error) {
        console.error("Error completing task:", error);
      } finally {
        setCompletingId(null);
      }
    }
  };

  // Toggle checkbox behavior: unfinish if finished; otherwise toggle selection only
  const toggleTaskCheckbox = async (task) => {
    try {
      if (task.isFinished) {
        await updateTask(task.id, { isFinished: false });
        setAvailableTasks(prev => prev.map(t => t.id === task.id ? { ...t, isFinished: false } : t));
        // Optionally bring it back to selectable state
      } else {
        setSelectedTaskId(prev => (prev === task.id ? null : task.id));
      }
    } catch (error) {
      console.error('Failed to toggle task checkbox:', error);
    }
  };

  // No full-page loading here; parent page handles initial loading
  
  return (
  <div className="grid md:grid-cols-2 gap-6 md:gap-8 relative w-full">
      {/* Timer Section */}
  <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg order-2 md:order-1">
        {showSettings ? (
          <SettingsPanel
            settings={settings}
            onSave={handleSaveSettings}
            isLoading={isLoading}
          />
        ) : (
          <>
            <div className="flex justify-center space-x-4 mb-8">
              <button 
                onClick={() => setMode('pomodoro')} 
                className={`px-4 py-2 rounded-full ${mode === 'pomodoro' ? 'bg-[#A23E48] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Pomodoro
              </button>
              <button 
                onClick={() => setMode('shortBreak')} 
                className={`px-4 py-2 rounded-full ${mode === 'shortBreak' ? 'bg-[#A23E48] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Short Break
              </button>
              <button 
                onClick={() => setMode('longBreak')} 
                className={`px-4 py-2 rounded-full ${mode === 'longBreak' ? 'bg-[#A23E48] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Long Break
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-6xl md:text-8xl font-bold text-[#A23E48] mb-6 md:mb-8 font-mono">
                {formatTime(timeLeft)}
              </div>
              
              <div className="flex space-x-4 mb-6">
                <button 
                  onClick={isRunning ? pauseTimer : startTimer}
                  className="bg-[#A23E48] text-white p-4 rounded-full hover:bg-[#8e3640] transition-colors"
                >
                  {isRunning ? <FaPause className="w-6 h-6" /> : <FaPlay className="w-6 h-6" />}
                </button>
                <button 
                  onClick={resetTimer}
                  className="bg-gray-200 p-4 rounded-full hover:bg-gray-300 transition-colors"
                >
                  <FaRedo className="w-6 h-6 text-gray-700" />
                </button>
              </div>
              
              <div className="text-center text-gray-600 mb-6">
                <p>Completed: {cycles} {cycles === 1 ? 'session' : 'sessions'}</p>
                {selectedTaskId && !availableTasks.find(t => t.id === selectedTaskId)?.isFinished && (
                  <div className="mt-4 text-center">
                    <p className="font-semibold mb-2">Current Task:</p>
                    <p>{availableTasks.find(task => task.id === selectedTaskId)?.title}</p>
                    <button 
                      onClick={handleTaskCompletion}
                      disabled={completingId === selectedTaskId}
                      aria-busy={completingId === selectedTaskId}
                      className={`hover:cursor-pointer mt-2 flex items-center gap-2 px-3 py-2 rounded-md transition-colors mx-auto ${
                        completingId === selectedTaskId
                          ? 'bg-[#A23E48]/70 text-white cursor-not-allowed'
                          : 'bg-[#A23E48] text-white hover:bg-[#93353f]'
                      }`}
                    >
                      {completingId === selectedTaskId ? (
                        <FaRedo className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaCheck className="w-4 h-4" />
                      )}
                      Mark as Complete
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => {setShowSettings(true)}}
                className="hover:cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#A23E48] transition-colors"
              >
                <IoMdSettings className="w-5 h-5" />
                Settings
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Tasks Section */}
  <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg relative order-1 md:order-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold text-[#A23E48]">Select a Task to Focus On</h2>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="hover:cursor-pointer px-4 py-2 rounded-md bg-[#A23E48] text-white text-sm font-semibold hover:bg-[#8e3640] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={adding}
          >
            + Add Task
          </button>
        </div>
        
  {availableTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No tasks available</p>
            <p className="mt-2 text-sm">Add one now to start focusing</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="hover:scale-105 transition-all duration-300 ease-in-out mt-4 hover:cursor-pointer px-4 py-2 rounded-md bg-[#A23E48] text-white text-sm font-semibold hover:bg-[#8e3640] "
              disabled={adding}
            >
              + Add Task
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1">
            {availableTasks
              .slice()
              .sort((a, b) =>
                // Unfinished first, finished last; then by rank within each group
                (Number(a.isFinished) - Number(b.isFinished)) || ((a.rank ?? 0) - (b.rank ?? 0))
              )
              .map(task => {
                const isSelected = task.id === selectedTaskId;
                const isChecked = task.isFinished || isSelected;
                const base = 'p-3 rounded-md transition-colors';
                const interactive = task.isFinished
                  ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                  : isSelected
                    ? 'bg-[#A23E48] text-white cursor-pointer'
                    : 'bg-gray-100 hover:bg-gray-200 cursor-pointer';
                return (
                  <div 
                    key={task.id}
                    onClick={() => {
                      if (task.isFinished) return;
                      setSelectedTaskId(task.id === selectedTaskId ? null : task.id);
                    }}
                    className={`${base} ${interactive}`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleTaskCheckbox(task); }}
                          className={`p-0.5 rounded ${task.isFinished ? 'cursor-pointer' : 'cursor-pointer'}`}
                          aria-label={task.isFinished ? 'Mark task as unfinished' : (isSelected ? 'Unselect task' : 'Select task')}
                          title={task.isFinished ? 'Mark as unfinished' : (isSelected ? 'Unselect' : 'Select')}
                        >
                          {isChecked
                            ? <MdCheckBox className={`w-5 h-5 ${task.isFinished ? 'text-[#A23E48]' : ''}`} />
                            : <MdCheckBoxOutlineBlank className="w-5 h-5" />}
                        </button>
                      </div>
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleAddTask} className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm flex flex-col gap-4">
            <h2 className="font-bold text-lg text-[#A23E48]">Add Focus Task</h2>
            {addError && <div className="text-sm text-red-600 bg-red-100 p-2 rounded">{addError}</div>}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Title</label>
              <input
                className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[#A23E48]/40"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Task title"
                maxLength={120}
                disabled={adding}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Description</label>
              <textarea
                className="border rounded px-3 py-2 outline-none resize-none focus:ring-2 focus:ring-[#A23E48]/40"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
                maxLength={500}
                disabled={adding}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium hover:cursor-pointer disabled:opacity-60"
                disabled={adding}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#A23E48] text-white text-sm font-semibold hover:bg-[#8e3640] hover:cursor-pointer disabled:opacity-60 flex items-center gap-2"
                disabled={adding}
              >
                {adding && <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />}
                {adding ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Floating Eye Button (open) */}
      <button
        onClick={() => router.push('/dashboard')}
        className="hover:cursor-pointer fixed bottom-6 right-6 bg-[#A23E48] text-white p-4 rounded-full shadow-lg hover:bg-[#8e3640] transition-all duration-300 hover:scale-110 z-30"
        aria-label="Back to Today"
        title="Back to Today"
      >
        <MdOutlineRemoveRedEye className="w-6 h-6" />
      </button>
    </div>
  );
};

export default PomodoroTimer;