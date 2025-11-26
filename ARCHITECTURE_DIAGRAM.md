# Architecture Diagram Description

## Visual Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                      (React Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Landing    │  │   Chatbot    │  │ Questionnaire│     │
│  │    Page      │  │  Component   │  │  Component   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼──────┐     │
│  │         PatientSummary & RiskResults              │     │
│  └───────────────────────────────────────────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST API
                        │ (Axios)
┌───────────────────────▼─────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│              (Node.js + Express.js Backend)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js Server                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │  │
│  │  │   /api/      │  │   /api/      │  │  /api/   │  │  │
│  │  │risk-assessment│  │  chatbot    │  │  fhir    │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │  │
│  └─────────┼──────────────────┼───────────────┼─────────┘  │
│            │                  │               │             │
│  ┌─────────▼──────────────────▼───────────────▼─────────┐  │
│  │            Risk Calculator Engine                     │  │
│  │  ┌──────────────┐         ┌──────────────┐          │  │
│  │  │ Framingham   │         │   PREVENT    │          │  │
│  │  │ Risk Score   │         │    Model     │          │  │
│  │  └──────────────┘         └──────────────┘          │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │    Database Comparison (Synthea Data)        │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        │               │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│   OpenAI     │ │  FHIR       │ │  Synthea   │ │  Risk      │
│   GPT-4 API  │ │  Server     │ │  Data      │ │  Models    │
│              │ │  (HAPI)     │ │  (JSON)    │ │  (Local)   │
└──────────────┘ └─────────────┘ └────────────┘ └────────────┘
```

## Component Interactions

### 1. User Interaction Flow
```
User → Landing Page → Choose Input Method → 
  Option A: Chatbot → AI Conversation → Data Collection
  Option B: Questionnaire → Form Input → Data Collection
→ Patient Summary → Risk Calculation → Results Display
```

### 2. API Request Flow
```
Frontend Component
    ↓ (HTTP Request)
Express.js Route Handler
    ↓ (Business Logic)
Risk Calculator / Chatbot Handler / FHIR Handler
    ↓ (External Services)
OpenAI API / FHIR Server / Local Models
    ↓ (Response)
Frontend Component (Display Results)
```

### 3. Risk Calculation Flow
```
Patient Data Input
    ↓
Risk Calculator
    ├→ Framingham Risk Score Calculation
    ├→ PREVENT Model Calculation
    ├→ Database Comparison (Synthea)
    └→ Recommendation Generation
    ↓
Combined Risk Assessment
    ↓
Results Display
```

## Technology Stack Visualization

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND                                                 │
│  • React 18.2                                           │
│  • Axios (HTTP Client)                                  │
│  • CSS3 (Styling)                                       │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│ BACKEND                                                  │
│  • Node.js                                              │
│  • Express.js 4.18                                      │
│  • Body Parser                                          │
│  • CORS                                                 │
└─────────────────────────────────────────────────────────┘
         ↕                ↕                ↕
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   OpenAI     │  │  FHIR        │  │  Risk        │
│   GPT-4      │  │  (HAPI)      │  │  Models      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Data Flow Sequence

### Chatbot Sequence
1. User sends message → Frontend
2. Frontend → Backend `/api/chatbot/message`
3. Backend → OpenAI GPT-4 API
4. OpenAI → Response + Extracted Data
5. Backend → Risk Calculator (if enough data)
6. Backend → Frontend (Results)
7. Frontend → Display to User

### Questionnaire Sequence
1. User fills form → Frontend
2. Frontend validates → Patient Summary
3. User confirms → Frontend → Backend `/api/risk-assessment/calculate`
4. Backend → Risk Calculator
5. Risk Calculator → Framingham + PREVENT Models
6. Risk Calculator → Database Comparison
7. Backend → Recommendations Generator
8. Backend → Frontend (Complete Results)
9. Frontend → RiskResults Component

## File Structure Reference

```
backend/
├── server.js              # Express server entry point
├── routes/
│   ├── riskAssessment.js  # Risk calculation endpoints
│   ├── chatbot.js         # Chatbot API endpoints
│   └── fhir.js            # FHIR integration endpoints
└── utils/
    ├── riskCalculator.js      # Main risk calculation engine
    ├── framinghamRiskScore.js # Framingham model
    ├── preventModel.js        # PREVENT model
    ├── databaseComparison.js  # Synthea data comparison
    └── syntheaLoader.js       # Synthea data loader

frontend/
├── src/
│   ├── App.js             # Main app component
│   └── components/
│       ├── Chatbot.js     # Chatbot interface
│       ├── Questionnaire.js # Health form
│       ├── PatientSummary.js # Data review
│       └── RiskResults.js # Results display
```

## Key Architecture Patterns

1. **RESTful API Design** - Clean separation between frontend and backend
2. **Component-Based UI** - Modular React components
3. **Service Layer Pattern** - Business logic separated in utils
4. **API Gateway Pattern** - Express routes act as API gateway
5. **Integration Pattern** - External services (OpenAI, FHIR) abstracted
6. **Model-View-Controller** - Clear separation of concerns

## Scalability Considerations

- **Horizontal Scaling**: Stateless API allows multiple backend instances
- **Caching**: Can add Redis for session management
- **Database**: Can migrate from in-memory to persistent database
- **Microservices**: Can split into separate services (chatbot, risk, fhir)
- **CDN**: Frontend can be served from CDN in production

