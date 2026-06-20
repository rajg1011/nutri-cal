import { X, Check, Zap, MessageSquare } from 'lucide-react';
import './css/SubscriptionModal.css';
import useScrollLock from './hooks/useScrollLock';
import { SUBSCRIPTION_TYPE, SUBSCRIPTION_TYPE_PRO, SUBSCRIPTION_TYPE_QUESTION, Constants } from '../utils/constant';

const SubscriptionModal = ({ onClose, onUpgrade }) => {
  useScrollLock();
  return (
    <div className="subscription-overlay" onClick={onClose}>
      <div className="subscription-container" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="subscription-header">
          <div className="subscription-badge">Limited Access</div>
          <h2 className="subscription-title">Unlock NutriAI</h2>
          <p className="subscription-subtitle">
            Get personalized insights and reach your fitness goals faster with our AI assistant.
          </p>
        </div>

        <div className="plans-list">
          {/* Pro Plan */}
          <div className="plan-card pro" onClick={() => onUpgrade(SUBSCRIPTION_TYPE_PRO)}>
            <div className="plan-header">
              <div className="plan-info">
                <div className="plan-icon green">
                  <Zap size={24} fill="currentColor" />
                </div>
                <div className="plan-name">Pro Access</div>
              </div>
              <div className="plan-price-block">
                <div className="popular-tag">Popular</div>
                <div className="plan-price">₹{SUBSCRIPTION_TYPE.PRO}<span>/mo</span></div>
              </div>
            </div>
            <div className="plan-features">
              <div className="feature-item">
                <Check size={18} /> Unlimited AI questions
              </div>
              <div className="feature-item">
                <Check size={18} /> Protein + macro insights
              </div>
              <div className="feature-item">
                <Check size={18} /> Personalized meal plans
              </div>
              <div className="feature-item">
                <Check size={18} /> Weekly AI health report
              </div>
            </div>
          </div>

          {/* Question Pack */}
          <div className="plan-card pack" onClick={() => onUpgrade(SUBSCRIPTION_TYPE_QUESTION)}>
            <div className="plan-header">
              <div className="plan-info">
                <div className="plan-icon blue">
                  <MessageSquare size={24} fill="currentColor" />
                </div>
                <div className="plan-name">Question Pack</div>
              </div>
              <div className="plan-price-block">
                <div className="plan-price">₹{SUBSCRIPTION_TYPE.QUESTION}</div>
              </div>
            </div>
            <div className="plan-features">
              <div className="feature-item">
                <Check size={18} /> {Constants.QUESTION_AKSED} AI questions (no expiry)
              </div>
              <div className="feature-item">
                <Check size={18} /> Pay only when needed
              </div>
              <div className="feature-item">
                <Check size={18} /> Great for casual users
              </div>
              <div className="feature-item">
                <Check size={18} /> No commitment
              </div>
            </div>
          </div>
        </div>

        <p className="sub-link">
          By continuing, you agree to our Terms and Conditions.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionModal;
