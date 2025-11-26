import React, { useState } from 'react';
import { executeFunction } from '../services/appwrite';
import './PatientSummary.css';

const PatientSummary = ({ patientData, onCalculateRisk, onBack }) => {
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculateRisk = async () => {
    setIsCalculating(true);
    try {
      // Include database comparison in the request
      const result = await executeFunction('riskAssessmentCalculate', {
        ...patientData,
        includeComparison: true
      });

      if (result && result.success) {
        onCalculateRisk(result.riskAssessment, result.recommendations);
      } else {
        console.error('Unexpected response format:', result);
        alert('Failed to calculate risk. Unexpected response from server.');
      }
    } catch (error) {
      console.error('Error calculating risk:', error);
      if (error.response) {
        // Server responded with error status
        console.error('Error response:', error.response.data);
        alert(`Failed to calculate risk: ${error.response.data?.message || error.response.data?.error || 'Server error'}`);
      } else if (error.request) {
        // Request made but no response received
        console.error('No response received:', error.request);
        alert('Failed to calculate risk. Please make sure the backend server is running on port 5000.');
      } else {
        // Something else happened
        console.error('Error setting up request:', error.message);
        alert(`Failed to calculate risk: ${error.message}`);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const formatValue = (value) => {
    if (value === undefined || value === null || value === '') return 'Not provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  return (
    <div className="summary-container">
      <div className="summary-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h2>Patient Summary</h2>
      </div>

      <div className="summary-content">
        <div className="summary-card">
          <h3>Basic Information</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Age:</span>
              <span className="value">{formatValue(patientData.age)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Gender:</span>
              <span className="value">{formatValue(patientData.gender)}</span>
            </div>
          </div>
        </div>

        {(patientData.systolicBP || patientData.diastolicBP) && (
          <div className="summary-card">
            <h3>Vital Signs</h3>
            <div className="summary-grid">
              {patientData.systolicBP && (
                <div className="summary-item">
                  <span className="label">Systolic BP:</span>
                  <span className="value">{patientData.systolicBP} mmHg</span>
                </div>
              )}
              {patientData.diastolicBP && (
                <div className="summary-item">
                  <span className="label">Diastolic BP:</span>
                  <span className="value">{patientData.diastolicBP} mmHg</span>
                </div>
              )}
              {patientData.cholesterol && (
                <div className="summary-item">
                  <span className="label">Total Cholesterol:</span>
                  <span className="value">{patientData.cholesterol} mg/dL</span>
                </div>
              )}
              {patientData.hdlCholesterol && (
                <div className="summary-item">
                  <span className="label">HDL Cholesterol:</span>
                  <span className="value">{patientData.hdlCholesterol} mg/dL</span>
                </div>
              )}
              {patientData.bmi && (
                <div className="summary-item">
                  <span className="label">BMI:</span>
                  <span className="value">{patientData.bmi}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="summary-card">
          <h3>Medical History & Lifestyle</h3>
          <div className="summary-grid">
            {patientData.diabetes !== undefined && (
              <div className="summary-item">
                <span className="label">Diabetes:</span>
                <span className="value">{formatValue(patientData.diabetes)}</span>
              </div>
            )}
            {patientData.familyHistory !== undefined && (
              <div className="summary-item">
                <span className="label">Family History:</span>
                <span className="value">{formatValue(patientData.familyHistory)}</span>
              </div>
            )}
            {patientData.smoking && (
              <div className="summary-item">
                <span className="label">Smoking:</span>
                <span className="value">{formatValue(patientData.smoking)}</span>
              </div>
            )}
            {patientData.physicalActivity && (
              <div className="summary-item">
                <span className="label">Physical Activity:</span>
                <span className="value">{formatValue(patientData.physicalActivity)}</span>
              </div>
            )}
            {patientData.dietQuality && (
              <div className="summary-item">
                <span className="label">Diet Quality:</span>
                <span className="value">{formatValue(patientData.dietQuality)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="summary-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Edit Information
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleCalculateRisk}
            disabled={isCalculating}
          >
            {isCalculating ? 'Calculating...' : 'Calculate Risk Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientSummary;

