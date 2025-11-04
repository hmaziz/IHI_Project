# Heart Disease Risk Assessment Application

A comprehensive web application for assessing heart disease risk using an AI-powered chatbot and validated medical risk factors.

## Project Overview

This application provides users with a personalized heart disease risk assessment through two main interfaces:
1. **Interactive AI Chatbot** - Natural conversation-based data collection
2. **Questionnaire Form** - Structured health information input

The application calculates risk scores based on validated cardiovascular risk factors and provides personalized recommendations for improving heart health.

## Team Members

- Suhani Jain - sjain340@gatech.edu
- Hamza Aziz - haziz30@gatech.edu
- Areeb Noor - anoor37@gatech.edu
- Hao Lin - hlin@gatech.edu
- Selim Uzgoren - selimuzgoren@gatech.edu

## Technology Stack

### Frontend
- **React** - UI framework
- **Axios** - HTTP client
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **OpenAI API** - AI chatbot integration
- **HAPI FHIR** - FHIR server integration

### Data Sources
- UCI Heart Disease Dataset (CSV)
- Framingham Study (CSV)
- Synthea (Synthetic FHIR JSON)
- HAPI FHIR Server (Sandbox)

## Project Structure

```
IHI_Project/
├── backend/
│   ├── routes/
│   │   ├── riskAssessment.js    # Risk calculation endpoints
│   │   ├── chatbot.js           # Chatbot API endpoints
│   │   └── fhir.js              # FHIR integration endpoints
│   ├── utils/
│   │   └── riskCalculator.js    # Risk scoring algorithm
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chatbot.js       # Chatbot interface
│   │   │   ├── Questionnaire.js # Health questionnaire
│   │   │   ├── PatientSummary.js # Patient data summary
│   │   │   └── RiskResults.js   # Risk assessment results
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- (Optional) HAPI FHIR Server running locally or remotely

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and add your OpenAI API key:
```
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
FHIR_SERVER_URL=http://localhost:8080/fhir
NODE_ENV=development
```

5. Start the backend server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend application will open at `http://localhost:3000`

## API Endpoints

### Risk Assessment
- `POST /api/risk-assessment/calculate` - Calculate heart disease risk
- `GET /api/risk-assessment/health` - Health check

### Chatbot
- `POST /api/chatbot/start` - Initialize chatbot session
- `POST /api/chatbot/message` - Send message to chatbot
- `POST /api/chatbot/calculate-risk` - Calculate risk from collected data

### FHIR Integration
- `GET /api/fhir/patient/:id` - Get patient from FHIR server
- `POST /api/fhir/patient` - Create/update patient in FHIR server
- `POST /api/fhir/observation` - Create observation in FHIR server
- `GET /api/fhir/patient/:id/observations` - Get patient observations

## Risk Assessment Algorithm

The risk calculator evaluates multiple factors:

### Factors Considered
- **Age** - Higher age increases risk
- **Gender** - Different risk profiles for men/women
- **Blood Pressure** - Hypertension significantly increases risk
- **Cholesterol** - Total and HDL cholesterol levels
- **Diabetes** - Major risk factor
- **Smoking Status** - Current/former/never
- **Family History** - Genetic predisposition
- **Physical Activity** - Protective factor
- **BMI** - Obesity increases risk
- **Diet Quality** - Heart-healthy diet is protective

### Risk Categories
- **High Risk** (Score ≥ 40) - Requires immediate medical attention
- **Moderate Risk** (Score 20-39) - Lifestyle changes recommended
- **Low-Moderate Risk** (Score 10-19) - Preventive measures advised
- **Low Risk** (Score < 10) - Maintain healthy lifestyle

## Features

### 1. Interactive Chatbot
- Natural language conversation
- Guided data collection
- Context-aware responses using OpenAI
- Real-time risk calculation when enough data is collected

### 2. Health Questionnaire
- Comprehensive form for all health factors
- Input validation
- Patient data summary before calculation

### 3. Risk Assessment Results
- Visual risk score display
- Categorized risk level
- Identified risk factors
- Personalized recommendations
- Actionable lifestyle changes

### 4. FHIR Integration
- Patient data storage in FHIR format
- Observation recording
- EHR simulation capabilities

## Usage

1. **Start Assessment**: Choose between chatbot or questionnaire
2. **Provide Information**: Answer questions about your health, lifestyle, and family history
3. **Review Summary**: (Questionnaire only) Review collected data
4. **View Results**: Get risk assessment and personalized recommendations
5. **Take Action**: Follow recommendations to improve heart health

## Important Disclaimers

⚠️ **Medical Disclaimer**: This tool is for informational and educational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.

## Development

### Running Tests
```bash
# Backend tests (if implemented)
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build
```

## Future Enhancements

- Machine learning model integration for improved accuracy
- Historical risk tracking
- Integration with wearable devices
- Multi-language support
- Mobile app version
- Advanced FHIR resource handling
- User authentication and data persistence

## License

This project is developed for educational purposes as part of CS6440 Health Informatics course at Georgia Tech.

## References

- World Health Organization - Cardiovascular diseases
- Framingham Heart Study
- UCI Heart Disease Dataset
- Cleveland Clinic - Cardiovascular disease information
- Harvard Health - Heart disease prevention

## Support

For issues or questions, please contact the development team members listed above.

