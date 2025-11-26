# Demo Script: Architecture Overview (5-Minute Version)

## Introduction (20 seconds)

"Hi! I'm going to walk you through the architecture of our Heart Disease Risk Assessment application. This is a full-stack web app that combines AI-powered conversation with validated medical risk models to help users assess their cardiovascular health."

---

## Architecture Overview (1 minute)

"Our application uses a **three-tier architecture**:

**Frontend Layer** - React-based user interface with two entry points: an AI chatbot and a structured questionnaire.

**Backend Layer** - Node.js and Express.js API server that processes requests, calculates risk scores, and integrates with external services.

**Data & Integration Layer** - Risk calculation models (Framingham and PREVENT), OpenAI API for the chatbot, and FHIR integration for healthcare data standards."

---

## Frontend Architecture (1 minute)

"The React frontend consists of five main components:

1. **App.js** - Manages application state and routing
2. **Chatbot** - Interactive chat interface for natural conversation
3. **Questionnaire** - Structured form for health data collection
4. **PatientSummary** - Displays collected information before calculation
5. **RiskResults** - Shows risk assessment with personalized recommendations

Users can choose their preferred input method, and the frontend communicates with our backend API through RESTful endpoints."

---

## Backend Architecture (1.5 minutes)

"Our Express.js backend provides three main API route groups:

**Risk Assessment Routes** (`/api/risk-assessment`)
- Calculates heart disease risk using two validated models:
  - **Framingham Risk Score** - 10-year coronary heart disease risk
  - **AHA PREVENT Model** - 10-year and 30-year cardiovascular disease risk
- Combines both models for comprehensive assessment
- Generates personalized recommendations based on risk factors

**Chatbot Routes** (`/api/chatbot`)
- Manages conversation sessions
- Integrates with OpenAI GPT-4 for intelligent responses
- Extracts health information from natural language
- Automatically triggers risk calculation when enough data is collected

**FHIR Routes** (`/api/fhir`)
- Stores and retrieves patient data in FHIR format
- Manages Observations (blood pressure, cholesterol, etc.)
- Supports EHR integration through HAPI FHIR servers"

---

## Data Flow (1 minute)

"Here's how data flows through the system:

**Chatbot Flow:**
User → React Frontend → Backend API → OpenAI GPT-4 → Risk Calculator → Results → Frontend Display

**Questionnaire Flow:**
User → Form Input → Validation → Backend API → Risk Models → Recommendations → Results Display

The risk calculator processes patient data through both Framingham and PREVENT models, compares results against Synthea database averages, and generates actionable health recommendations."

---

## Key Technologies (30 seconds)

"**Frontend:** React for the UI
**Backend:** Node.js and Express.js for the API
**AI:** OpenAI GPT-4 for conversational interface
**Healthcare:** FHIR standards for data interoperability
**Models:** Framingham and AHA PREVENT for risk calculation
**Data:** Synthea synthetic data for comparison and validation"

---

## Conclusion (20 seconds)

"This architecture provides a scalable, modular solution that combines modern web technologies with validated medical models. The separation of concerns allows us to easily extend functionality, add new risk models, or integrate additional data sources. Thank you!"

---

## Total Duration: ~5 minutes

## Quick Reference Points:
- **3-tier architecture**: Frontend → Backend → Data/Integration
- **2 input methods**: Chatbot (AI) and Questionnaire (Form)
- **2 risk models**: Framingham + PREVENT
- **3 API route groups**: Risk Assessment, Chatbot, FHIR
- **Key integration**: OpenAI GPT-4 for AI conversation




