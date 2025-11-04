import React from 'react';
import './RiskResults.css';

const RiskResults = ({ riskAssessment, recommendations, patientData, onBack }) => {
  const getRiskColor = (category) => {
    switch (category) {
      case 'high':
        return '#e74c3c';
      case 'moderate':
        return '#f39c12';
      case 'low-moderate':
        return '#3498db';
      case 'low':
        return '#27ae60';
      default:
        return '#667eea';
    }
  };

  const getRiskIcon = (category) => {
    switch (category) {
      case 'high':
        return '⚠️';
      case 'moderate':
        return '⚡';
      case 'low-moderate':
        return '💡';
      case 'low':
        return '✅';
      default:
        return '📊';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return '#e74c3c';
      case 'high':
        return '#f39c12';
      case 'moderate':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Start
        </button>
        <h2>Risk Assessment Results</h2>
      </div>

      <div className="results-content">
        {/* Risk Score Display */}
        <div className="risk-score-card">
          <div className="risk-icon">{getRiskIcon(riskAssessment.category)}</div>
          <h2 className="risk-category" style={{ color: getRiskColor(riskAssessment.category) }}>
            {riskAssessment.categoryDescription}
          </h2>
          <div className="risk-score">
            <span className="score-value">{riskAssessment.riskScore}</span>
            <span className="score-label">Risk Score</span>
          </div>
          <p className="risk-description">
            Based on your health information, your risk for developing heart disease is classified as{' '}
            <strong style={{ color: getRiskColor(riskAssessment.category) }}>
              {riskAssessment.categoryDescription}
            </strong>.
          </p>
        </div>

        {/* Risk Factors */}
        {riskAssessment.factors && riskAssessment.factors.length > 0 && (
          <div className="factors-card">
            <h3>Key Risk Factors Identified</h3>
            <ul className="factors-list">
              {riskAssessment.factors.map((factor, index) => (
                <li key={index} className="factor-item">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="recommendations-card">
            <h3>Personalized Recommendations</h3>
            <p className="recommendations-intro">
              Based on your risk assessment, here are actionable steps you can take to improve your heart health:
            </p>
            <div className="recommendations-list">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-header">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(rec.priority) }}
                    >
                      {rec.priority.toUpperCase()}
                    </span>
                    <h4 className="recommendation-category">{rec.category}</h4>
                  </div>
                  <p className="recommendation-action">
                    <strong>Action:</strong> {rec.action}
                  </p>
                  <p className="recommendation-details">{rec.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Summary Snapshot */}
        <div className="summary-snapshot-card">
          <h3>Your Information Summary</h3>
          <div className="snapshot-grid">
            <div className="snapshot-item">
              <span className="snapshot-label">Age:</span>
              <span className="snapshot-value">{patientData?.age || 'N/A'}</span>
            </div>
            <div className="snapshot-item">
              <span className="snapshot-label">Gender:</span>
              <span className="snapshot-value">{patientData?.gender || 'N/A'}</span>
            </div>
            {patientData?.systolicBP && (
              <div className="snapshot-item">
                <span className="snapshot-label">Blood Pressure:</span>
                <span className="snapshot-value">
                  {patientData.systolicBP}/{patientData.diastolicBP || '--'} mmHg
                </span>
              </div>
            )}
            {patientData?.cholesterol && (
              <div className="snapshot-item">
                <span className="snapshot-label">Cholesterol:</span>
                <span className="snapshot-value">{patientData.cholesterol} mg/dL</span>
              </div>
            )}
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="disclaimer-card">
          <h4>⚠️ Important Medical Disclaimer</h4>
          <p>
            This risk assessment tool is for informational and educational purposes only. It is not intended to
            replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician
            or other qualified health provider with any questions you may have regarding a medical condition or
            your cardiovascular health.
          </p>
          <p>
            If you have a high risk score or are experiencing any symptoms of heart disease (chest pain, shortness
            of breath, irregular heartbeat, etc.), please consult with a healthcare professional immediately.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Start New Assessment
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskResults;

