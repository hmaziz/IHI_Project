import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = ({ onDataCollected, onRiskCalculated, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [collectedData, setCollectedData] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize chatbot session
    initializeChatbot();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatbot = async () => {
    try {
      const response = await axios.post('/api/chatbot/start');
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

    try {
      const response = await axios.post('/api/chatbot/message', {
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
      // Otherwise, if we have enough data, show summary first
      if (response.data.riskAssessment && response.data.recommendations) {
        // User confirmed calculation - go straight to results
        setTimeout(() => {
          // Make sure collectedData is passed to risk results
          onRiskCalculated(response.data.riskAssessment, response.data.recommendations);
        }, 2000);
      } else if (response.data.hasEnoughData && response.data.collectedData && 
                 Object.keys(response.data.collectedData).length >= 3) {
        // We have enough data but haven't calculated yet - show summary
        // Check if this is the confirmation prompt
        const isConfirmationPrompt = response.data.response && 
          response.data.response.includes('Would you like me to proceed');
        if (isConfirmationPrompt) {
          // Show summary before calculating
          setTimeout(() => {
            onDataCollected(response.data.collectedData);
          }, 1000);
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
    }
  };

  const handleQuickCalculate = async () => {
    if (Object.keys(collectedData).length < 2) {
      alert('Please provide more information through the chat before calculating risk.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/chatbot/calculate-risk', {
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
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;

