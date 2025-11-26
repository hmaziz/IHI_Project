import React, { useState } from 'react';
import { executeFunction } from '../services/appwrite';
import './Questionnaire.css';

const Questionnaire = ({ onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    systolicBP: '',
    diastolicBP: '',
    cholesterol: '',
    hdlCholesterol: '',
    diabetes: '',
    smoking: '',
    familyHistory: '',
    physicalActivity: '',
    bmi: '',
    dietQuality: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.age || isNaN(formData.age) || formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Please enter a valid age (1-120)';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (formData.systolicBP && (isNaN(formData.systolicBP) || formData.systolicBP < 50 || formData.systolicBP > 300)) {
      newErrors.systolicBP = 'Please enter a valid systolic blood pressure';
    }

    if (formData.diastolicBP && (isNaN(formData.diastolicBP) || formData.diastolicBP < 30 || formData.diastolicBP > 200)) {
      newErrors.diastolicBP = 'Please enter a valid diastolic blood pressure';
    }

    if (formData.cholesterol && (isNaN(formData.cholesterol) || formData.cholesterol < 50 || formData.cholesterol > 500)) {
      newErrors.cholesterol = 'Please enter a valid cholesterol level';
    }

    if (formData.bmi && (isNaN(formData.bmi) || formData.bmi < 10 || formData.bmi > 60)) {
      newErrors.bmi = 'Please enter a valid BMI (10-60)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertValue = (value) => {
    if (value === 'yes' || value === 'true') return true;
    if (value === 'no' || value === 'false') return false;
    if (value === '') return undefined;
    if (!isNaN(value)) return Number(value);
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to proper types
      const patientData = {
        age: Number(formData.age),
        gender: formData.gender,
        systolicBP: formData.systolicBP ? Number(formData.systolicBP) : undefined,
        diastolicBP: formData.diastolicBP ? Number(formData.diastolicBP) : undefined,
        cholesterol: formData.cholesterol ? Number(formData.cholesterol) : undefined,
        hdlCholesterol: formData.hdlCholesterol ? Number(formData.hdlCholesterol) : undefined,
        diabetes: convertValue(formData.diabetes),
        smoking: formData.smoking,
        familyHistory: convertValue(formData.familyHistory),
        physicalActivity: formData.physicalActivity || undefined,
        bmi: formData.bmi ? Number(formData.bmi) : undefined,
        dietQuality: formData.dietQuality || undefined
      };

      // Remove undefined values
      Object.keys(patientData).forEach(key => {
        if (patientData[key] === undefined) {
          delete patientData[key];
        }
      });

      // Store data in FHIR
      try {
        const result = await executeFunction('fhirQuestionnaire', patientData);
        if (result && result.success) {
          console.log('Questionnaire data stored in FHIR:', result);
          if (result.results?.patientId) patientData.fhirPatientId = result.results.patientId;
        }
      } catch (fhirError) {
        console.error('Error storing data in FHIR:', fhirError);
        if (fhirError.response) console.error('FHIR Error details:', fhirError.response.data);
      }

      onComplete(patientData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h2>Health Assessment Questionnaire</h2>
      </div>

      <form className="questionnaire-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="age">
              Age <span className="required">*</span>
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="1"
              max="120"
              required
            />
            {errors.age && <span className="error">{errors.age}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="gender">
              Gender <span className="required">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <span className="error">{errors.gender}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Vital Signs</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="systolicBP">Systolic Blood Pressure (mmHg)</label>
              <input
                type="number"
                id="systolicBP"
                name="systolicBP"
                value={formData.systolicBP}
                onChange={handleChange}
                min="50"
                max="300"
              />
              {errors.systolicBP && <span className="error">{errors.systolicBP}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="diastolicBP">Diastolic Blood Pressure (mmHg)</label>
              <input
                type="number"
                id="diastolicBP"
                name="diastolicBP"
                value={formData.diastolicBP}
                onChange={handleChange}
                min="30"
                max="200"
              />
              {errors.diastolicBP && <span className="error">{errors.diastolicBP}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cholesterol">Total Cholesterol (mg/dL)</label>
              <input
                type="number"
                id="cholesterol"
                name="cholesterol"
                value={formData.cholesterol}
                onChange={handleChange}
                min="50"
                max="500"
              />
              {errors.cholesterol && <span className="error">{errors.cholesterol}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hdlCholesterol">HDL Cholesterol (mg/dL)</label>
              <input
                type="number"
                id="hdlCholesterol"
                name="hdlCholesterol"
                value={formData.hdlCholesterol}
                onChange={handleChange}
                min="10"
                max="150"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bmi">Body Mass Index (BMI)</label>
            <input
              type="number"
              id="bmi"
              name="bmi"
              value={formData.bmi}
              onChange={handleChange}
              min="10"
              max="60"
              step="0.1"
            />
            {errors.bmi && <span className="error">{errors.bmi}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Medical History</h3>
          
          <div className="form-group">
            <label htmlFor="diabetes">Do you have diabetes?</label>
            <select
              id="diabetes"
              name="diabetes"
              value={formData.diabetes}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="familyHistory">Family history of heart disease?</label>
            <select
              id="familyHistory"
              name="familyHistory"
              value={formData.familyHistory}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Lifestyle Factors</h3>
          
          <div className="form-group">
            <label htmlFor="smoking">Smoking Status</label>
            <select
              id="smoking"
              name="smoking"
              value={formData.smoking}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="never">Never</option>
              <option value="former">Former Smoker</option>
              <option value="current">Current Smoker</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="physicalActivity">Physical Activity Level</label>
            <select
              id="physicalActivity"
              name="physicalActivity"
              value={formData.physicalActivity}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="none">None (Sedentary)</option>
              <option value="minimal">Minimal (Light activity)</option>
              <option value="moderate">Moderate (Regular exercise)</option>
              <option value="active">Active (Intense regular exercise)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dietQuality">Diet Quality</label>
            <select
              id="dietQuality"
              name="dietQuality"
              value={formData.dietQuality}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="poor">Poor</option>
              <option value="fair">Fair</option>
              <option value="good">Good</option>
              <option value="excellent">Excellent</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Questionnaire;

