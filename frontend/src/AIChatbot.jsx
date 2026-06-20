import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './css/AIChatbot.css';
import useScrollLock from './hooks/useScrollLock';

const HISTORY_PAGE_SIZE = 10;
const SCROLL_TOP_LOAD_THRESHOLD = 70;

const toMessage = (msg) => ({
  id: msg.id,
  type: msg.role === 'assistant' ? 'ai' : 'user',
  content: msg.content,
});

const AIChatbot = ({ user, session, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'ai',
      content: `Hi ${user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! I'm your NutriAI assistant. How can I help you reach your goals today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const messagesContainerRef = useRef(null);
  const oldestCursorRef = useRef(null);
  const scrollActionRef = useRef('bottom');
  const preserveOffsetRef = useRef(0);

  useScrollLock();

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const action = scrollActionRef.current;
    scrollActionRef.current = 'bottom';

    if (action === 'preserve') {
      container.scrollTop = container.scrollHeight - preserveOffsetRef.current;
    } else if (action === 'bottom-smooth') {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (isTyping && container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [isTyping]);

  const fetchHistoryPage = async (cursor) => {
    const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/api/chatbot/history`);
    url.searchParams.set('limit', HISTORY_PAGE_SIZE);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
    });
    return response.json();
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchHistoryPage();

        if (data.success && data.history?.length > 0) {
          setMessages(data.history.map(toMessage));
          oldestCursorRef.current = data.history[0].id;
          setHasMoreHistory(data.history.length === HISTORY_PAGE_SIZE);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadHistory();
  }, []);

  const loadOlderMessages = async () => {
    if (isLoadingMore || !hasMoreHistory || oldestCursorRef.current == null) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchHistoryPage(oldestCursorRef.current);

      if (data.success && data.history?.length > 0) {
        const container = messagesContainerRef.current;
        if (container) {
          preserveOffsetRef.current = container.scrollHeight - container.scrollTop;
          scrollActionRef.current = 'preserve';
        }

        setMessages(prev => [...data.history.map(toMessage), ...prev]);
        oldestCursorRef.current = data.history[0].id;
        setHasMoreHistory(data.history.length === HISTORY_PAGE_SIZE);
      } else {
        setHasMoreHistory(false);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMessagesScroll = (e) => {
    if (e.target.scrollTop < SCROLL_TOP_LOAD_THRESHOLD) {
      loadOlderMessages();
    }
  };


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', content: input };
    scrollActionRef.current = 'bottom-smooth';
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chatbot/chat`, {
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
        scrollActionRef.current = 'bottom-smooth';
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
      scrollActionRef.current = 'bottom-smooth';
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

        <div className="ai-chat-messages" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
          {isLoadingMore && (
            <div className="message ai">
              <div className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.type === 'ai' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
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
          <p className="ai-chat-disclaimer">AI may be wrong, use carefully.</p>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
