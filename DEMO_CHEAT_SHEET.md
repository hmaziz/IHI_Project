# Demo Cheat Sheet - Quick Reference

## Architecture Overview (30 seconds)
- **3-tier architecture**: Frontend → Backend → Data/Integration
- **React frontend** with chatbot and questionnaire
- **Node.js/Express backend** with RESTful API
- **Risk models**: Framingham + PREVENT
- **AI integration**: OpenAI GPT-4
- **Healthcare standards**: FHIR integration

## Key Points to Highlight

### Frontend (React)
- ✅ Component-based architecture
- ✅ Two input methods: Chatbot and Questionnaire
- ✅ Responsive UI with modern design
- ✅ Real-time chat interface
- ✅ Form validation and user feedback

### Backend (Node.js/Express)
- ✅ RESTful API design
- ✅ Three main route groups:
  - `/api/risk-assessment` - Risk calculation
  - `/api/chatbot` - AI conversation
  - `/api/fhir` - Healthcare data
- ✅ Modular utility functions
- ✅ Error handling and validation

### Risk Calculation
- ✅ **Framingham Risk Score** - 10-year CHD risk
- ✅ **AHA PREVENT Model** - 10-year and 30-year CVD risk
- ✅ Combined scoring approach
- ✅ Database comparison with Synthea data
- ✅ Personalized recommendations

### AI Integration
- ✅ OpenAI GPT-4 for natural conversation
- ✅ Context-aware responses
- ✅ Health data extraction from text
- ✅ Automatic risk calculation trigger

### FHIR Integration
- ✅ Patient resource storage
- ✅ Observation resources (vitals)
- ✅ HAPI FHIR server support
- ✅ Healthcare data interoperability

## Data Flow (Quick Explanation)

**Chatbot:**
User → Chat → Backend → OpenAI → Extract Data → Calculate Risk → Display

**Questionnaire:**
User → Form → Validate → Backend → Risk Models → Recommendations → Display

## Technology Stack (One-liner)
React + Node.js + Express + OpenAI GPT-4 + FHIR + Framingham/PREVENT Models

## Demo Flow Suggestions

1. **Start with landing page** - Show two options
2. **Demonstrate chatbot** - Show AI conversation
3. **Show questionnaire** - Alternative input method
4. **Display results** - Risk assessment with recommendations
5. **Explain architecture** - Walk through code structure
6. **Show API endpoints** - Demonstrate backend functionality

## Key Files to Reference

### Frontend
- `src/App.js` - Main application component
- `src/components/Chatbot.js` - Chatbot interface
- `src/components/Questionnaire.js` - Form component
- `src/components/RiskResults.js` - Results display

### Backend
- `server.js` - Express server setup
- `routes/riskAssessment.js` - Risk calculation API
- `routes/chatbot.js` - Chatbot API
- `utils/riskCalculator.js` - Risk calculation engine
- `utils/framinghamRiskScore.js` - Framingham model
- `utils/preventModel.js` - PREVENT model

## Talking Points

### Why This Architecture?
- **Modular**: Easy to extend and maintain
- **Scalable**: Can handle multiple users
- **Standards-based**: Uses FHIR for healthcare data
- **Validated**: Uses clinically validated risk models
- **User-friendly**: Multiple input methods

### Key Features
- AI-powered conversation
- Validated medical models
- Healthcare data standards (FHIR)
- Personalized recommendations
- Database comparison
- Responsive design

## Common Questions & Answers

**Q: Why two risk models?**
A: Combining Framingham and PREVENT provides more comprehensive risk assessment and validation.

**Q: How does the chatbot extract health data?**
A: OpenAI GPT-4 processes natural language and extracts structured health information from conversation.

**Q: What is FHIR?**
A: FHIR (Fast Healthcare Interoperability Resources) is a standard for exchanging healthcare information electronically.

**Q: How is data stored?**
A: Data can be stored in FHIR format on HAPI FHIR servers or locally. Currently uses in-memory storage for sessions.

**Q: Can this replace medical consultation?**
A: No, this is an educational tool. Users should consult healthcare professionals for medical advice.

## Timing Guide

- **Introduction**: 20-30 seconds
- **Architecture Overview**: 1 minute
- **Frontend**: 1 minute
- **Backend**: 1.5 minutes
- **Data Flow**: 1 minute
- **Technologies**: 30 seconds
- **Conclusion**: 20-30 seconds
- **Total**: ~5-6 minutes

## Visual Aids Suggestions

1. Show the application running
2. Display component hierarchy
3. Show API endpoints in action
4. Highlight risk calculation code
5. Demonstrate FHIR resources
6. Show database comparison results

## Ending Statement
"This architecture provides a scalable, modular solution that combines modern web technologies with validated medical models. The separation of concerns allows for easy extension and maintenance. Thank you!"




