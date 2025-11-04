const express = require('express');
const router = express.Router();
const riskCalculator = require('../utils/riskCalculator');

/**
 * POST /api/risk-assessment/calculate
 * Calculate heart disease risk based on patient data
 */
router.post('/calculate', (req, res) => {
  try {
    const patientData = req.body;

    // Validate required fields
    const requiredFields = ['age', 'gender'];
    const missingFields = requiredFields.filter(field => !patientData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Calculate risk
    const riskAssessment = riskCalculator.calculateRisk(patientData);
    
    // Generate recommendations
    const recommendations = riskCalculator.generateRecommendations(riskAssessment, patientData);

    res.json({
      success: true,
      riskAssessment,
      recommendations
    });
  } catch (error) {
    console.error('Error calculating risk:', error);
    res.status(500).json({
      error: 'Failed to calculate risk assessment',
      message: error.message
    });
  }
});

/**
 * GET /api/risk-assessment/health
 * Health check for risk assessment service
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'risk-assessment' });
});

module.exports = router;

