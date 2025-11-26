import React, { useState, useEffect, useRef } from 'react';
import { executeFunction } from '../services/appwrite';
import './Chatbot.css';

const Chatbot = ({ onDataCollected, onRiskCalculated, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [collectedData, setCollectedData] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Initialize chatbot session
    initializeChatbot();
  }, []);

  useEffect(() => {
    scrollToBottom();
    // Focus input after messages update (when assistant responds)
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isLoading]);

  const initializeChatbot = async () => {
    try {
      const result = await executeFunction('chatbotStart', {});
      // Expected result shape: { sessionId, welcomeMessage }
      setSessionId(result.sessionId);
      setMessages([{ role: 'assistant', content: result.welcomeMessage }]);
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m here to help you assess your risk for heart disease. Let\'s start with a simple question: What\'s your age?'
      }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Focus input immediately after clearing (before API call)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    try {
      const result = await executeFunction('chatbotMessage', {
        message: userMessage,
        sessionId: sessionId || `session_${Date.now()}`,
        conversationHistory: messages
      });

      const aiResponse = result.response;
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      if (result.collectedData) setCollectedData(result.collectedData);

      if (result.riskAssessment && result.recommendations) {
        setTimeout(() => onRiskCalculated(result.riskAssessment, result.recommendations), 2000);
      } else if (result.hasEnoughData && result.collectedData) {
        const isConfirmationPrompt = result.response && (
          result.response.includes('Would you like me to calculate') || result.response.includes('Would you like me to proceed')
        );
        if (isConfirmationPrompt) {
          setTimeout(() => onDataCollected(result.collectedData), 1000);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or use the questionnaire form instead.'
      }]);
    } finally {
      setIsLoading(false);
      // Focus input after response is processed
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleQuickCalculate = async () => {
    if (Object.keys(collectedData).length < 2) {
      alert('Please provide more information through the chat before calculating risk.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await executeFunction('chatbotCalculateRisk', { patientData: collectedData });
      if (result && result.success) {
        onRiskCalculated(result.riskAssessment, result.recommendations);
      } else {
        console.error('Unexpected response format:', result);
        alert('Failed to calculate risk. Unexpected response from server.');
      }
    } catch (error) {
      console.error('Error calculating risk:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Failed to calculate risk: ${error.response.data?.message || error.response.data?.error || 'Server error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Failed to calculate risk. Please make sure Appwrite Functions are configured and reachable.');
      } else {
        console.error('Error setting up request:', error.message);
        alert(`Failed to calculate risk: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h2>Chat Assessment</h2>
        <button 
          className="btn-calculate"
          onClick={handleQuickCalculate}
          disabled={isLoading || Object.keys(collectedData).length < 2}
        >
          Calculate Risk
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <span className="typing-indicator">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSendMessage}>
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          autoFocus
        />
        <button type="submit" disabled={isLoading || !inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;

