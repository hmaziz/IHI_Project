// Vercel serverless function - catch-all route for all API endpoints
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import routes from backend
const riskAssessmentRoutes = require('../backend/routes/riskAssessment');
const chatbotRoutes = require('../backend/routes/chatbot');
const fhirRoutes = require('../backend/routes/fhir');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes - mount at root since Vercel already handles /api prefix
app.use('/risk-assessment', riskAssessmentRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/fhir', fhirRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Heart Disease Risk Assessment API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Heart Disease Risk Assessment API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      chatbot: {
        start: 'POST /api/chatbot/start',
        message: 'POST /api/chatbot/message',
        calculateRisk: 'POST /api/chatbot/calculate-risk'
      },
      riskAssessment: {
        calculate: 'POST /api/risk-assessment/calculate',
        health: 'GET /api/risk-assessment/health'
      },
      fhir: {
        patient: 'GET/POST /api/fhir/patient/:id',
        observation: 'POST /api/fhir/observation'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Export the serverless handler
module.exports = serverless(app);

