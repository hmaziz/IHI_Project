const express = require('express');
const router = express.Router();
const riskCalculator = require('../utils/riskCalculator');

/**
 * POST /api/risk-assessment/calculate
 * Calculate heart disease risk based on patient data
 * Uses combined Framingham and PREVENT models with database comparison
 */
router.post('/calculate', async (req, res) => {
  try {
    const patientData = req.body;
    // Always include database comparison by default (can be disabled with includeComparison=false)
    const includeComparison = req.body.includeComparison !== false;

    // Validate required fields
    const requiredFields = ['age', 'gender'];
    const missingFields = requiredFields.filter(field => !patientData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Calculate risk using combined models with database comparison
    const riskAssessment = await riskCalculator.calculateRisk(patientData, includeComparison);
    
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

/**
 * GET /api/risk-assessment/synthea-status
 * Check Synthea data availability and statistics
 */
router.get('/synthea-status', async (req, res) => {
  try {
    const syntheaLoader = require('../utils/syntheaLoader');
    const databaseComparison = require('../utils/databaseComparison');
    
    const stats = syntheaLoader.calculateStatistics();
    const dbStats = await databaseComparison.getDatabaseStatistics();
    
    res.json({
      success: true,
      syntheaDataAvailable: Object.keys(stats).some(key => stats[key].count > 0),
      statistics: {
        systolicBP: { count: stats.systolicBP.count, average: stats.systolicBP.average },
        diastolicBP: { count: stats.diastolicBP.count, average: stats.diastolicBP.average },
        cholesterol: { count: stats.cholesterol.count, average: stats.cholesterol.average },
        hdlCholesterol: { count: stats.hdlCholesterol.count, average: stats.hdlCholesterol.average },
        bmi: { count: stats.bmi.count, average: stats.bmi.average },
        age: { count: stats.age.count, average: stats.age.average }
      },
      dataSource: dbStats.systolicBP?.source || 'default',
      dataDirectory: syntheaLoader.dataDirectory
    });
  } catch (error) {
    console.error('Error checking Synthea status:', error);
    res.status(500).json({
      error: 'Failed to check Synthea status',
      message: error.message
    });
  }
});

module.exports = router;

