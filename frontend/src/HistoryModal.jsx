import  { useState, useEffect } from 'react';
import { X, RotateCcw, ChevronDown, ChevronUp, Info, Activity, Flame, Target } from 'lucide-react';
import supabase from '../core/supabaseClient';
import './css/HistoryModal.css';

const HistoryModal = ({ user, onClose }) => {
  const [history, setHistory] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const today = new Date();
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(today.getDate() - 10);
        tenDaysAgo.setHours(0, 0, 0, 0);

        const { data: logs, error: logsError } = await supabase
          .from('userCaloriesData')
          .select('calories, protein, created_at')
          .eq('user_id', user.id)
          .gte('created_at', tenDaysAgo.toISOString());

        if (logsError) throw logsError;

        const { data: goals, error: goalsError } = await supabase
          .from('dailyUserGoals')
          .select('calories, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (goalsError) throw goalsError;

        const historyList = [];
        for (let i = 1; i <= 10; i++) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const dayLogs = logs.filter(l => l.created_at.startsWith(dateStr));
          const totalCalories = dayLogs.reduce((acc, l) => acc + (l.calories || 0), 0);
          const totalProtein = dayLogs.reduce((acc, l) => acc + (parseFloat(l.protein) || 0), 0);

          const activeGoal = goals.find(g => new Date(g.created_at) <= new Date(dateStr + 'T23:59:59Z'));
          const dayGoal = activeGoal ? activeGoal.calories : 2000; 

          historyList.push({
            date: dateStr,
            formattedDate: formatDate(dateStr),
            calories: totalCalories,
            protein: totalProtein.toFixed(1),
            goal: dayGoal,
            hasData: dayLogs.length > 0
          });
        }
        
        const filteredHistory = historyList.filter(day => day.hasData);
        setHistory(filteredHistory);
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const toggleExpand = (date) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  return (
    <div className="modal-overlay form-fade-in history-overlay">
      <div className="history-modal-container">
        <div className="history-header">
          <div className="history-title">
            <RotateCcw size={20} className="history-title-icon" /> History
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="history-body-list">
          {loading ? (
            <div className="history-loading">Fetching records...</div>
          ) : history.length === 0 ? (
            <div className="history-empty-state fade-in">
              <div className="history-empty-icon">
                <img src="https://cdn-icons-png.flaticon.com/512/3652/3652191.png" alt="calendar" width="80" />
              </div>
              <h3 className="history-empty-title">No history yet</h3>
              <p className="history-empty-desc">Your past days will appear here</p>
            </div>
          ) : (
            history.map((day) => (
              <div key={day.date} className={`history-item ${expandedDay === day.date ? 'expanded' : ''}`}>
                <div className="history-item-header" onClick={() => toggleExpand(day.date)}>
                  <div className="history-item-date">{day.formattedDate}</div>
                  {expandedDay === day.date ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {expandedDay === day.date && (
                  <div className="history-item-details fade-in">
                    <div className="history-stats-grid">
                      <div className="history-stat">
                        <Target size={14} className="stat-icon goal" />
                        <div className="stat-val">{day.goal}</div>
                        <div className="stat-lbl">Goal</div>
                      </div>
                      <div className="history-stat">
                        <Flame size={14} className="stat-icon cal" />
                        <div className="stat-val">{day.calories}</div>
                        <div className="stat-lbl">Kcal</div>
                      </div>
                      <div className="history-stat">
                        <Activity size={14} className="stat-icon prot" />
                        <div className="stat-val">{day.protein}g</div>
                        <div className="stat-lbl">Protein</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
