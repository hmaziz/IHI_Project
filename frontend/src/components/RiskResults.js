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
            <span className="score-value">{riskAssessment.riskPercentage || riskAssessment.riskScore}%</span>
            <span className="score-label">10-Year Risk</span>
          </div>
          <p className="risk-description">
            Based on combined Framingham Risk Score and AHA PREVENT model analysis, your 10-year risk for developing heart disease is{' '}
            <strong style={{ color: getRiskColor(riskAssessment.category) }}>
              {riskAssessment.riskPercentage || riskAssessment.riskScore}%
            </strong>, classified as{' '}
            <strong style={{ color: getRiskColor(riskAssessment.category) }}>
              {riskAssessment.categoryDescription}
            </strong>.
          </p>
        </div>

        {/* Model Comparison */}
        {riskAssessment.models && (
          <div className="models-card">
            <h3>Risk Model Analysis</h3>
            <div className="models-grid">
              {riskAssessment.models.framingham ? (
                <div className="model-item">
                  <h4>Framingham Risk Score</h4>
                  <div className="model-risk">
                    <span className="model-percentage">
                      {riskAssessment.models.framingham.riskPercentage}%
                    </span>
                    <span className="model-label">10-Year Risk</span>
                  </div>
                  {riskAssessment.models.framingham.score !== undefined && (
                    <div className="model-score">
                      <span>Points: {riskAssessment.models.framingham.score}</span>
                    </div>
                  )}
                  <p className="model-description">
                    Based on the Framingham Heart Study prediction model
                  </p>
                </div>
              ) : (
                <div className="model-item model-unavailable">
                  <h4>Framingham Risk Score</h4>
                  <p className="model-unavailable-text">
                    Not available. Framingham risk calculation requires age between 30-74 years and complete data (blood pressure, cholesterol, HDL cholesterol).
                  </p>
                </div>
              )}
              {riskAssessment.models.prevent ? (
                <div className="model-item">
                  <h4>AHA PREVENT Model</h4>
                  <div className="model-risk">
                    <span className="model-percentage">
                      {riskAssessment.models.prevent.risk10Year}%
                    </span>
                    <span className="model-label">10-Year Risk</span>
                  </div>
                  {riskAssessment.models.prevent.risk30Year && (
                    <div className="model-risk-secondary">
                      <span>{riskAssessment.models.prevent.risk30Year}%</span>
                      <span>30-Year Risk</span>
                    </div>
                  )}
                  <p className="model-description">
                    Based on the American Heart Association PREVENT equations
                  </p>
                </div>
              ) : (
                <div className="model-item model-unavailable">
                  <h4>AHA PREVENT Model</h4>
                  <p className="model-unavailable-text">
                    Not available. PREVENT model calculation requires complete patient data.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database Comparison */}
        {riskAssessment.databaseComparison && riskAssessment.databaseComparison.insights && riskAssessment.databaseComparison.insights.length > 0 && (
          <div className="comparison-card">
            <h3>📊 Comparison with Database Averages</h3>
            <p className="comparison-intro">
              Your health metrics compared to the Synthea database population:
              {riskAssessment.databaseComparison.databaseSampleSize > 0 && (
                <span className="sample-size">
                  {' '}(Based on {riskAssessment.databaseComparison.databaseSampleSize} records)
                </span>
              )}
            </p>
            <div className="comparison-insights">
              {riskAssessment.databaseComparison.insights.map((insight, index) => (
                <div key={index} className="insight-item">
                  <div className="insight-header">
                    <h4>{insight.metric}</h4>
                    <span className={`insight-status ${insight.recommendation.includes('well-controlled') || insight.recommendation.includes('excellent') || insight.recommendation.includes('favorable') ? 'positive' : 'attention'}`}>
                      {insight.recommendation.includes('well-controlled') || insight.recommendation.includes('excellent') || insight.recommendation.includes('favorable') ? '✓' : '⚠'}
                    </span>
                  </div>
                  <div className="insight-comparison">
                    <div className="comparison-value">
                      <span className="label">Your Value:</span>
                      <span className="value patient">{insight.patient}</span>
                    </div>
                    <div className="comparison-value">
                      <span className="label">Database Average:</span>
                      <span className="value average">{insight.average}</span>
                    </div>
                  </div>
                  <p className="insight-text">{insight.insight}</p>
                  <p className="insight-recommendation">{insight.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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

