import React, { useState, useRef, useEffect } from 'react';
import { Leaf, SlidersHorizontal, Plus, Target, Flame, Trash2, User, History, LogOut, Sparkles } from 'lucide-react';
import './css/App.css';
import './css/AIChatbot.css';
import LogFoodModal from './LogFoodModal';
import HistoryModal from './HistoryModal';
import AIChatbot from './AIChatbot';
import SubscriptionModal from './SubscriptionModal';
import supabase from '../core/supabaseClient';
import { usePayment } from './hooks/usePayment';
import LoadingScreen from './LoadingScreen';
import { toast } from 'react-toastify';
import { ACTIVE_AI, SUBSCRIPTION_TYPE } from '../utils/constant';

const MEAL_ICONS = {
  Breakfast: '🌅',
  Lunch: '☀️',
  Dinner: '🌙',
  Snack: '🍎'
};

const Dashboard = ({ user, session }) => {
  const [showLogFood, setShowLogFood] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [tempTarget, setTempTarget] = useState(2000);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [targetError, setTargetError] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isCheckingSub, setIsCheckingSub] = useState(false);
  const { pay, error, isLoading: loadingPayment } = usePayment({ user, session })
  const [logs, setLogs] = useState([]);

  const consumed = logs.reduce((acc, log) => acc + log.calories, 0);
  const totalProtein = logs.reduce((acc, log) => acc + (parseFloat(log.protein) || 0), 0);
  const remaining = dailyTarget - consumed;
  const isOverGoal = consumed > dailyTarget;

  const radius = 120;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progressPercentage = Math.min((consumed / dailyTarget) * 100, 100);
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  const progressColor = isOverGoal ? '#e53e3e' : 'var(--primary-green)';
  const numberColor = isOverGoal ? '#e53e3e' : 'var(--text-primary)';

  const fetchLogs = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('userCaloriesData')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`)
      // Not strictly needed if created_at is default now(), but good for robustness
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return;
    }

    const formattedLogs = data.map(log => ({
      id: log.id,
      meal: log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1),
      name: log.food_item,
      calories: log.calories,
      protein: log.protein,
      details: `${log.quantity} ${log.meal_unit}`,
      time: new Date(log.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }));

    setLogs(formattedLogs);
  };

  const fetchDailyGoal = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('dailyUserGoals')
      .select('calories')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching daily goal:', error);
      return;
    }

    if (data && data.length > 0) {
      setDailyTarget(data[0].calories);
      setTempTarget(data[0].calories);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchLogs();
      fetchDailyGoal();
    }
  }, [user?.id]);

  const handleAddFood = () => {
    fetchLogs();
    setShowLogFood(false);
  };

  const handleDeleteFood = async (id) => {
    setLogs(prev => prev.filter(log => log.id !== id));

    try {
      const { error } = await supabase
        .from('userCaloriesData')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting log:', err);
      fetchLogs();
    }
  };

  const handleSaveTarget = () => {
    if (tempTarget < 500 || tempTarget > 20000) {
      setTargetError('Your daily calorie goal must be between 500 and 20,000 kcals.');
      return;
    }
    if (tempTarget === dailyTarget) { setShowSettings(false); return; }
    if (logs.length > 0) {
      setPendingTarget(tempTarget);
    } else {
      setDailyTarget(tempTarget);
      saveDailyGoal(tempTarget);
      setShowSettings(false);
    }
  };

  const saveDailyGoal = async (calories) => {
    const { error } = await supabase
      .from('dailyUserGoals')
      .insert([{ user_id: user.id, calories }]);

    if (error) {
      console.error('Error saving daily goal:', error);
    }
  };

  const confirmTargetChange = () => {
    const newTarget = pendingTarget;
    setIsRecalculating(true);
    setPendingTarget(null);
    setShowSettings(false);
    saveDailyGoal(newTarget);
    setTimeout(() => {
      setDailyTarget(newTarget);
      setIsRecalculating(false);
    }, 450);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAIChatClick = async () => {
    if (isCheckingSub) return;
    setIsCheckingSub(true);
    try {
      const { data, error } = await supabase
        .from('userSubscriptionDetails')
        .select('subscription_type,status')
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        setShowSubscriptionModal(true);
        return;
      }

      const plan = data[0]?.plan?.toUpperCase() || 'FREE';
      if ((Object.keys(SUBSCRIPTION_TYPE).includes(plan)) && data[0]?.status?.toUpperCase() === ACTIVE_AI) {
        setShowAIChat(true);
      } else {
        setShowSubscriptionModal(true);
      }
    } catch (err) {
      console.error('Subscription check failed:', err);
      setShowSubscriptionModal(true);
    } finally {
      setIsCheckingSub(false);
    }
  };

  const handleSignOut = async () => {
    setShowDropdown(false);
    await supabase.auth.signOut();
  };

  const mealsList = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const groupedLogs = mealsList.map(meal => {
    const mealLogs = logs.filter(l => l.meal === meal);
    return { meal, logs: mealLogs, total: mealLogs.reduce((acc, l) => acc + l.calories, 0) };
  }).filter(group => group.logs.length > 0);

  return (
    <div className="app-container fade-in">
      <header className="header">
        <div className="header-left">
          <div className="day-subtitle">
            <Leaf size={14} /> {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
          </div>
          <h1 className="date-title">
            {new Date().toLocaleDateString('en-US', { month: 'long' })} {new Date().getDate()}
            {(() => {
              const d = new Date().getDate();
              if (d > 3 && d < 21) return 'th';
              switch (d % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
              }
            })()}
          </h1>
        </div>
        <div className="header-actions">
          <button
            className={`icon-btn ${isCheckingSub ? 'loading-sparkle' : ''}`}
            style={{ color: 'var(--primary-green)' }}
            onClick={handleAIChatClick}
            disabled={isCheckingSub}
          >
            <Sparkles size={18} fill="currentColor" />
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(!showSettings)}><SlidersHorizontal size={18} /></button>
          <div className="dropdown-wrapper" ref={dropdownRef}>
            <button className="icon-btn" onClick={() => setShowDropdown(p => !p)}>
              <User size={18} />
            </button>
            {showDropdown && (
              <div className="dropdown-menu fade-in">
                <button className="dropdown-item" onClick={() => { setShowHistory(true); setShowDropdown(false); }}>
                  <History size={15} /> History
                </button>
                <button className="dropdown-item danger" onClick={handleSignOut}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="daily-target-card fade-in">
          <div className="card-label">DAILY TARGET (KCAL)</div>
          <div className="target-input-row">
            <input type="number" value={tempTarget} onChange={(e) => setTempTarget(Number(e.target.value))} className="target-input" />
            <div className="target-actions">
              <button className="cancel-btn" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveTarget}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className={`progress-container ${isRecalculating ? 'recalculating' : ''}`}>
        <div className="svg-wrapper">
          <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`} width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
            <circle stroke="var(--circle-bg)" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
            <circle
              stroke={progressColor} fill="transparent" strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset: isRecalculating ? circumference : strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease' }}
              strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius}
            />
          </svg>
          <div className="progress-inner-content">
            <div className="consumed-label">CONSUMED</div>
            <div className="consumed-value"><span className="number" style={{ color: numberColor }}>{consumed}</span> kcal</div>
            <div className="goal-pill">Goal: {dailyTarget}</div>
          </div>
        </div>
      </div>

      <div className={`stats-row ${isRecalculating ? 'recalculating' : ''}`}>
        <div className="stat-card">
          <div className="stat-label"><Target size={14} /> TARGET</div>
          <div className="stat-value">{dailyTarget}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label green"><Flame size={14} /> REMAINING</div>
          <div className={`stat-value ${isOverGoal ? 'red' : 'green'}`}>{Math.max(remaining, 0)}</div>
        </div>
      </div>

      <div className="log-section">
        <div className="log-header">
          <h2>Today's Log</h2>
          <div className="log-header-right">
            <span className="log-protein-total">Total Protein: {totalProtein.toFixed(1)}g</span>
            <span className="log-count">{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-icon-circle">🥗</div>
            <h3 className="empty-title">No food logged yet</h3>
            <p className="empty-desc">Tap <strong>+ Add Food</strong> to get started</p>
          </div>
        ) : (
          <div className="log-list">
            {groupedLogs.map(group => (
              <div key={group.meal} className="log-group">
                <div className="log-group-header">
                  <div className="log-group-title"><span className="meal-icon">{MEAL_ICONS[group.meal]}</span> {group.meal}</div>
                  <div className="log-group-total">{group.total} kcal</div>
                </div>
                <div className="log-items">
                  {group.logs.map(log => (
                    <div key={log.id} className="log-item fade-in">
                      <div className="log-item-icon">{MEAL_ICONS[log.meal]}</div>
                      <div className="log-item-details">
                        <div className="log-item-name">{log.name}</div>
                        <div className="log-item-sub">
                          {log.details ? `${log.details} • ` : ''}
                          {log.protein ? `${log.protein}g protein • ` : ''}
                          {log.time}
                        </div>
                      </div>
                      <div className="log-item-calories">
                        <div className="log-cal-val">{log.calories}</div>
                        <div className="log-cal-lbl">KCAL</div>
                      </div>
                      <button className="log-item-delete" onClick={() => handleDeleteFood(log.id)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShowLogFood(true)}><Plus size={24} /> Add Food</button>
      <div style={{ height: '100px' }}></div>

      {showLogFood && <LogFoodModal user={user} onClose={() => setShowLogFood(false)} onAdd={handleAddFood} />}

      {showAIChat && (
        <AIChatbot
          user={user}
          session={session}
          onClose={() => setShowAIChat(false)}
        />
      )}

      {pendingTarget !== null && (
        <div className="modal-overlay fade-in">
          <div className="confirm-modal">
            <h3 className="confirm-title">Update Goal?</h3>
            <p className="confirm-desc">Changing your daily goal will recalculate your progress graph and remaining calories.</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setPendingTarget(null)}>Cancel</button>
              <button className="confirm-btn" onClick={confirmTargetChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {targetError !== null && (
        <div className="modal-overlay fade-in" style={{ zIndex: 1100 }}>
          <div className="confirm-modal">
            <h3 className="confirm-title" style={{ color: '#e53e3e' }}>Invalid Goal</h3>
            <p className="confirm-desc">{targetError}</p>
            <div className="confirm-actions">
              <button className="confirm-btn" style={{ backgroundColor: '#e53e3e' }} onClick={() => setTargetError(null)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && <HistoryModal user={user} onClose={() => setShowHistory(false)} />}

      {loadingPayment && <LoadingScreen />}

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onUpgrade={async (plan) => {
            if (error) toast.error(error)
            pay(plan)
            setShowSubscriptionModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
