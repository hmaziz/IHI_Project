import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = ({ onDataCollected, onRiskCalculated, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [collectedData, setCollectedData] = useState({});
  const [riskData, setRiskData] = useState(null); // Store risk assessment data
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

    // Keep focus on input
    if (inputRef.current) inputRef.current.focus();

    try {
      const response = await axios.post('/api/chatbot/message', {
        message: userMessage,
        sessionId: sessionId || `session_${Date.now()}`,
        conversationHistory: messages
      });

      // Update collected data
      if (response.data.collectedData) {
        setCollectedData(response.data.collectedData);
      }

      // Handle risk assessment responses with different stages
      if (response.data.riskAssessment && response.data.recommendations) {
        const { riskAssessment, recommendations } = response.data;
        setRiskData({ riskAssessment, recommendations });
        
        // Update collected data if provided
        if (response.data.collectedData) {
          setCollectedData(response.data.collectedData);
        }
        
        // Show the AI response (which includes the question)
        const aiResponse = response.data.response;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: aiResponse,
          // Only show button when assessment is complete
          hasButton: response.data.isComplete === true,
          riskData: response.data.isComplete ? { riskAssessment, recommendations } : null
        }]);
      } else {
        // Regular AI response
        const aiResponse = response.data.response;
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      }

      // Note: When user confirms "yes", backend returns riskAssessment directly
      // So we don't need to handle hasEnoughData separately - it's already handled above
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

  const generateSummaryParagraph = (riskAssessment, recommendations, patientData) => {
    const riskPercentage = riskAssessment.riskPercentage || riskAssessment.riskScore;
    const category = riskAssessment.categoryDescription || riskAssessment.category;
    
    // Get detailed comparison insights with actual values
    let comparisonText = '';
    if (riskAssessment.databaseComparison && riskAssessment.databaseComparison.insights) {
      const insights = riskAssessment.databaseComparison.insights;
      // Get top 2-3 most relevant comparisons (prioritize ones with significant differences)
      const relevantInsights = insights.filter(insight => 
        insight.insight && (insight.insight.includes('higher') || insight.insight.includes('lower'))
      ).slice(0, 3);
      
      if (relevantInsights.length > 0) {
        comparisonText = ' Compared to database averages, ';
        const comparisons = relevantInsights.map(insight => {
          // Extract specific comparison details with actual values
          if (insight.insight.includes('higher')) {
            const percentMatch = insight.insight.match(/(\d+\.?\d*)% higher/);
            if (percentMatch && insight.patient && insight.average) {
              return `your ${insight.metric.toLowerCase()} (${insight.patient}) is ${percentMatch[1]}% higher than the average (${insight.average})`;
            } else if (insight.patient && insight.average) {
              return `your ${insight.metric.toLowerCase()} (${insight.patient}) is higher than the average (${insight.average})`;
            }
            return `your ${insight.metric.toLowerCase()} is higher than average`;
          } else if (insight.insight.includes('lower')) {
            const percentMatch = insight.insight.match(/(\d+\.?\d*)% lower/);
            if (percentMatch && insight.patient && insight.average) {
              return `your ${insight.metric.toLowerCase()} (${insight.patient}) is ${percentMatch[1]}% lower than the average (${insight.average})`;
            } else if (insight.patient && insight.average) {
              return `your ${insight.metric.toLowerCase()} (${insight.patient}) is lower than the average (${insight.average})`;
            }
            return `your ${insight.metric.toLowerCase()} is lower than average`;
          } else if (insight.patient && insight.average) {
            return `your ${insight.metric.toLowerCase()} (${insight.patient}) is similar to the average (${insight.average})`;
          }
          return null;
        }).filter(c => c !== null); // Remove null entries
        
        if (comparisons.length > 0) {
          comparisonText += comparisons.join(', ') + '.';
        }
      }
    }

    // Get detailed lifestyle recommendations with specific actions
    const lifestyleRecs = recommendations
      .filter(rec => ['Diet', 'Physical Activity', 'Weight Management', 'Cholesterol', 'Blood Pressure'].includes(rec.category))
      .slice(0, 3); // Get top 3 recommendations
    
    let lifestyleText = '';
    if (lifestyleRecs.length > 0) {
      const specificActions = [];
      
      lifestyleRecs.forEach(rec => {
        if (rec.category === 'Diet') {
          specificActions.push('eat more fruits and vegetables (aim for 5 servings daily), choose whole grains over refined grains, and reduce processed foods');
        } else if (rec.category === 'Physical Activity') {
          if (patientData.physicalActivity === 'none' || patientData.physicalActivity === 'sedentary') {
            specificActions.push('start with simple activities like walking 30 minutes a day or taking the stairs instead of elevators');
          } else {
            specificActions.push('increase your activity to at least 150 minutes of moderate exercise per week (like brisk walking, cycling, or swimming)');
          }
        } else if (rec.category === 'Weight Management') {
          specificActions.push('work toward a healthy weight through portion control and regular physical activity - even a 5-10% weight loss can make a significant difference');
        } else if (rec.category === 'Cholesterol') {
          specificActions.push('reduce saturated fats (found in red meat and full-fat dairy) and increase omega-3 rich foods like fish, nuts, and seeds');
        } else if (rec.category === 'Blood Pressure') {
          specificActions.push('reduce sodium intake (aim for less than 2,300mg per day) and increase potassium-rich foods like bananas, spinach, and sweet potatoes');
        }
      });

      if (specificActions.length > 0) {
        lifestyleText = ' To improve your heart health, consider: ' + specificActions.join('; ') + '.';
      }
    }

    return `Based on your health information, your 10-year heart disease risk is ${riskPercentage}%, which is classified as ${category}.${comparisonText}${lifestyleText}`;
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
        const { riskAssessment, recommendations } = response.data;
        setRiskData({ riskAssessment, recommendations });
        
        // Generate summary paragraph
        const summary = generateSummaryParagraph(riskAssessment, recommendations, collectedData);
        
        // Add summary message with button to chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: summary,
          hasButton: true,
          riskData: { riskAssessment, recommendations }
        }]);
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

  const handleViewDetailedResults = (riskData) => {
    if (riskData) {
      // Pass patientData along with risk calculation
      onRiskCalculated(riskData.riskAssessment, riskData.recommendations, collectedData);
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
              {msg.hasButton && msg.riskData && (
                <div style={{ marginTop: '15px' }}>
                  <button
                    className="btn-view-results"
                    onClick={() => handleViewDetailedResults(msg.riskData)}
                  >
                    View Detailed Results →
                  </button>
                </div>
              )}
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
