import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import './css/AIChatbot.css';
import useScrollLock from './hooks/useScrollLock';

const AIChatbot = ({ user, session, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hi ${user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! I'm your NutriAI assistant. How can I help you reach your goals today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useScrollLock();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Calling the local backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ message: currentInput }),
      });

      const data = await response.json();

      if (data.success) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMsg = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Sorry, I'm having trouble connecting to the brain right now. Please try again in a moment!"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "How am I doing today?",
    "Healthy dinner ideas?",
    "Check my protein intake",
    "Should I eat more?"
  ];

  return (
    <div className="ai-chat-overlay" onClick={onClose}>
      <div className="ai-chat-container" onClick={e => e.stopPropagation()}>
        <div className="ai-chat-header">
          <div className="ai-header-info">
            <div className="ai-avatar">
              <Sparkles size={20} fill="white" />
            </div>
            <div className="ai-title-group">
              <span className="ai-title">NutriAI Assistant</span>
              <span className="ai-subtitle">Active Consultant</span>
            </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div className="message ai">
              <div className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!isTyping && (
          <div className="ai-suggestions">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                className="ai-suggestion-btn"
                onClick={() => { setInput(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="ai-chat-input-area">
          <div className="chat-input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            {/* <span className="chat-input">AI is making itself better </span> */}
            <button
              className="send-chat-btn"
              disabled={!input.trim() || isTyping}
              // disabled= {true}
              onClick={handleSend}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
