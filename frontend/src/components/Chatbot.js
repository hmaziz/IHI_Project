import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
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
    // Always keep focus on input unless loading just finished,
    // but we removed the disabled state so we can focus immediately/always
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isLoading]);

  const initializeChatbot = async () => {
    try {
      const response = await apiClient.post('/chatbot/start');
      setSessionId(response.data.sessionId);
      setMessages([{
        role: 'assistant',
        content: response.data.welcomeMessage
      }]);
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

    // Keep focus on input
    if (inputRef.current) inputRef.current.focus();

    try {
      const response = await apiClient.post('/chatbot/message', {
        message: userMessage,
        sessionId: sessionId || `session_${Date.now()}`,
        conversationHistory: messages
      });

      const aiResponse = response.data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Update collected data
      if (response.data.collectedData) {
        setCollectedData(response.data.collectedData);
      }

      // If user confirmed and risk assessment is ready, show results
      if (response.data.riskAssessment && response.data.recommendations) {
        // User confirmed calculation - go straight to results
        setTimeout(() => {
          // Make sure collectedData is passed to risk results
          onRiskCalculated(response.data.riskAssessment, response.data.recommendations);
        }, 2000);
      } else if (response.data.hasEnoughData && response.data.collectedData) {
        // All questions have been asked - check if this is the confirmation prompt
        const isConfirmationPrompt = response.data.response &&
          (response.data.response.includes('Would you like me to calculate') ||
           response.data.response.includes('Would you like me to proceed'));
        if (isConfirmationPrompt) {
          // All questions completed - show summary before calculating
          setTimeout(() => {
            onDataCollected(response.data.collectedData);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Handle session expiration or server restart
      if (error.response && error.response.status === 400 && error.response.data.error.includes('Session not found')) {
         setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Session expired. Starting a new assessment...'
        }]);
        setTimeout(() => initializeChatbot(), 1500);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.'
        }]);
      }
    } finally {
      setIsLoading(false);
      // Ensure focus returns to input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  };

  const handleQuickCalculate = async () => {
    if (Object.keys(collectedData).length < 2) {
      alert('Please provide more information through the chat before calculating risk.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/chatbot/calculate-risk', {
        patientData: collectedData
      });

      if (response.data && response.data.success) {
        onRiskCalculated(response.data.riskAssessment, response.data.recommendations);
      } else {
        console.error('Unexpected response format:', response.data);
        alert('Failed to calculate risk. Unexpected response from server.');
      }
    } catch (error) {
      console.error('Error calculating risk:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Failed to calculate risk: ${error.response.data?.message || error.response.data?.error || 'Server error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Failed to calculate risk. Please make sure the backend server is running on port 5000.');
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
