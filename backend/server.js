const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const riskAssessmentRoutes = require('./routes/riskAssessment');
const chatbotRoutes = require('./routes/chatbot');
const fhirRoutes = require('./routes/fhir');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/risk-assessment', riskAssessmentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/fhir', fhirRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Heart Disease Risk Assessment API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

