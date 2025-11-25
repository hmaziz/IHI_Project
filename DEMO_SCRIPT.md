# Demo Script: Heart Disease Risk Assessment Application Architecture

## Introduction (30 seconds)

"Hello! Today I'll be walking you through the architecture of our Heart Disease Risk Assessment application. This is a full-stack web application that helps users assess their risk for cardiovascular disease using AI-powered conversation and validated medical risk models."

---

## High-Level Architecture Overview (1 minute)

"Our application follows a three-tier architecture pattern:

**First, we have the Presentation Layer** - our React frontend that provides an intuitive user interface. Users can interact with the application through two main interfaces: an AI-powered chatbot or a structured questionnaire form.

**Second, we have the Application Layer** - our Node.js and Express.js backend server that handles all business logic, API requests, and integrates with external services.

**Third, we have the Data Layer** - which includes our risk calculation models, FHIR server integration for healthcare data standards, and OpenAI API for intelligent conversation."

---

## Frontend Architecture (1.5 minutes)

"Let's start with the frontend, built with React.

**Component Structure:**
- We have a main `App.js` component that manages the application state and routing between different views
- The `Chatbot` component provides an interactive chat interface where users can have natural conversations about their health
- The `Questionnaire` component offers a structured form for users who prefer traditional data entry
- The `PatientSummary` component displays collected health information before risk calculation
- And the `RiskResults` component presents the final risk assessment with personalized recommendations

**User Flow:**
Users start at a landing page where they can choose between the chatbot or questionnaire. Based on their input, data flows to our backend API, and results are displayed in an easy-to-understand format with color-coded risk levels and actionable recommendations."

---

## Backend Architecture (2 minutes)

"Moving to the backend, we have a RESTful API built with Express.js.

**API Routes:**
- `/api/risk-assessment/calculate` - This endpoint receives patient data and calculates risk scores
- `/api/chatbot/start` - Initializes a new chatbot session
- `/api/chatbot/message` - Handles user messages and generates AI responses
- `/api/fhir/*` - Endpoints for FHIR resource management and EHR integration

**Risk Calculation Engine:**
Our backend uses two validated medical models:
1. **Framingham Risk Score** - A well-established model that calculates 10-year coronary heart disease risk based on age, gender, blood pressure, cholesterol, and other factors
2. **AHA PREVENT Model** - The American Heart Association's newer model that calculates both 10-year and 30-year cardiovascular disease risk

These models are combined to provide a comprehensive risk assessment. We also include database comparison functionality that compares patient data against Synthea-generated synthetic healthcare data for additional context."

---

## AI Integration (1 minute)

"For the chatbot functionality, we integrate with OpenAI's GPT-4 API.

**How it works:**
- The chatbot maintains conversation context throughout the session
- It intelligently extracts health information from natural language responses
- It guides users through questions about age, lifestyle, medical history, and vital signs
- Once sufficient data is collected, it automatically triggers the risk calculation
- The AI provides empathetic, non-judgmental responses while gathering medically relevant information"

---

## FHIR Integration (1 minute)

"For healthcare data interoperability, we've integrated FHIR standards.

**FHIR Implementation:**
- Patient data can be stored as FHIR Patient resources
- Vital signs like blood pressure and cholesterol are stored as FHIR Observations
- We support integration with HAPI FHIR servers for EHR simulation
- This allows the application to work with standardized healthcare data formats
- Data can be queried from and written to FHIR-compliant systems"

---

## Data Flow (1 minute)

"Let me walk you through the complete data flow:

**Chatbot Flow:**
1. User starts a conversation in the React frontend
2. Frontend sends messages to `/api/chatbot/message` endpoint
3. Backend processes the message with OpenAI API
4. Backend extracts and stores health data from the conversation
5. When enough data is collected, backend calculates risk using our models
6. Results are sent back to frontend and displayed to the user

**Questionnaire Flow:**
1. User fills out the structured form
2. Data is validated on the frontend
3. User reviews their information in the Patient Summary
4. Data is sent to `/api/risk-assessment/calculate`
5. Backend processes data through Framingham and PREVENT models
6. Recommendations are generated based on risk factors
7. Complete results are displayed with risk score, category, and actionable advice"

---

## Key Features (30 seconds)

"Key architectural features include:
- **Modular design** - Each component has a single responsibility
- **API-first approach** - Clean separation between frontend and backend
- **Medical validation** - Uses clinically validated risk models
- **Scalable architecture** - Can easily add new risk models or data sources
- **Healthcare standards** - FHIR integration for interoperability
- **User-friendly** - Multiple interfaces (chatbot and form) for different user preferences"

---

## Technology Stack Summary (30 seconds)

"To summarize our technology stack:
- **Frontend:** React for the user interface
- **Backend:** Node.js and Express.js for the API server
- **AI:** OpenAI GPT-4 for intelligent conversation
- **Healthcare Standards:** FHIR for data interoperability
- **Risk Models:** Framingham and AHA PREVENT models
- **Data Sources:** Synthea synthetic data for comparison and testing"

---

## Conclusion (30 seconds)

"This architecture provides a robust, scalable solution for heart disease risk assessment. It combines modern web technologies with validated medical models and healthcare standards to deliver an accessible tool for preventive healthcare. The modular design makes it easy to extend with additional risk models, data sources, or features in the future.

Thank you for watching! If you have any questions about the architecture, I'd be happy to answer them."

---

## Total Duration: ~8-9 minutes

## Tips for Presentation:
- Show the actual application running while explaining
- Highlight code structure in your IDE when discussing components
- Demonstrate the chatbot in action
- Show the API endpoints working (maybe with Postman or browser dev tools)
- Point out the risk calculation models in the code
- Mention the FHIR resources if demonstrating data storage

