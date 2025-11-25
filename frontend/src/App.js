import React, { useState } from 'react';
import './App.css';
import Chatbot from './components/Chatbot';
import PatientSummary from './components/PatientSummary';
import RiskResults from './components/RiskResults';
import Questionnaire from './components/Questionnaire';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // landing, chat, questionnaire, summary, results
  const [patientData, setPatientData] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const handleStartAssessment = () => {
    setCurrentView('chat');
  };

  const handleStartQuestionnaire = () => {
    setCurrentView('questionnaire');
  };

  const handleDataCollected = (data) => {
    setPatientData(data);
    setCurrentView('summary');
  };

  const handleRiskCalculated = (assessment, recs, patientDataFromChat = null) => {
    setRiskAssessment(assessment);
    setRecommendations(recs);
    // If patientData is provided from chatbot, set it
    if (patientDataFromChat && !patientData) {
      setPatientData(patientDataFromChat);
    }
    setCurrentView('results');
  };

  const handleBackToStart = () => {
    setCurrentView('landing');
    setPatientData(null);
    setRiskAssessment(null);
    setRecommendations(null);
  };

  return (
    <div className="App">
      {currentView === 'landing' && (
        <div className="landing-container">
          <div className="landing-content">
            <h1 className="landing-title">Heart Disease Risk Assessment</h1>
            <p className="landing-subtitle">
              Assess your risk for heart disease with our AI-powered chatbot
            </p>
            <p className="landing-description">
              Our interactive tool will guide you through a series of questions about your health,
              lifestyle, and family history to provide you with a personalized risk assessment
              and actionable recommendations.
            </p>
            <div className="landing-buttons">
              <button 
                className="btn btn-primary"
                onClick={handleStartAssessment}
              >
                Start Chat Assessment
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleStartQuestionnaire}
              >
                Fill Out Questionnaire
              </button>
            </div>
            <div className="landing-disclaimer">
              <p>
                <strong>Disclaimer:</strong> This tool is for informational purposes only and is not
                intended to replace professional medical advice, diagnosis, or treatment. Always seek
                the advice of your physician or other qualified health provider with any questions
                you may have regarding a medical condition.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentView === 'chat' && (
        <Chatbot
          onDataCollected={handleDataCollected}
          onRiskCalculated={handleRiskCalculated}
          onBack={handleBackToStart}
        />
      )}

      {currentView === 'questionnaire' && (
        <Questionnaire
          onComplete={handleDataCollected}
          onBack={handleBackToStart}
        />
      )}

      {currentView === 'summary' && patientData && (
        <PatientSummary
          patientData={patientData}
          onCalculateRisk={handleRiskCalculated}
          onBack={handleBackToStart}
        />
      )}

      {currentView === 'results' && riskAssessment && (
        <RiskResults
          riskAssessment={riskAssessment}
          recommendations={recommendations}
          patientData={patientData}
          onBack={handleBackToStart}
        />
      )}
    </div>
  );
}

export default App;

