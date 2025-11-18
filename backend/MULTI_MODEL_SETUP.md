# Multi-Model Backend Setup Guide

This system now supports **multiple healthcare AI backends** working together to provide comprehensive risk assessment.

## Available Models

### 1. Traditional Risk Models (Always Active)
- **Framingham Risk Score** - Established cardiovascular risk calculator
- **PREVENT Model** - AHA's newer risk assessment model

### 2. AI/ML Models (Optional)

#### Conversational Models
- **featherless-ai-quants/nztinversive-llama3.2-1B-HeartDiseasePrediction-GGUF** - Specialized heart disease chatbot (GGUF format, may require local execution)
- **microsoft/DialoGPT-medium** - Generic conversational LLM (fallback)
- **Other LLMs** - Configurable via `FALLBACK_LLM_MODEL`

#### Healthcare-Specific Models
- **Sarah0022/heart-disease-model** - Machine learning model for heart disease prediction

## How It Works

### Risk Assessment (Combined Models)

When calculating risk, the system uses **multiple models** and averages their results:

1. **Framingham Risk Score** - Traditional statistical model
2. **PREVENT Model** - Modern AHA risk calculator  
3. **Sarah0022/heart-disease-model** - ML-based prediction (if enabled)

**Result**: The system averages predictions from all available models for more accurate assessment.

### Conversational Responses

The chatbot can use multiple LLMs for responses:
1. **Generic LLM** (if enabled) - For natural conversation
2. **Specialized Heart Disease Model** (if available) - For domain-specific responses
3. **Rule-based Fallback** - Always available for reliability

## Configuration

### Enable/Disable Models

In your `.env` file:

```bash
# Generic conversational LLM
USE_GENERIC_LLM=true
FALLBACK_LLM_MODEL=microsoft/DialoGPT-medium

# Sarah0022 heart disease model (for risk assessment)
USE_HEART_DISEASE_MODEL=true
HEART_DISEASE_MODEL=Sarah0022/heart-disease-model
```

### Model Usage

**All models work together** - you can use:
- ✅ Only traditional models (Framingham + PREVENT)
- ✅ Traditional + Sarah0022 model
- ✅ All models combined (recommended for best accuracy)

## Testing

### Test Sarah0022 Model

```bash
curl http://localhost:5001/api/chatbot/test-sarah-model
```

Expected response:
```json
{
  "success": true,
  "message": "Sarah0022/heart-disease-model is working",
  "testResult": {
    "riskPercentage": 12.5,
    "category": "moderate",
    "riskScore": 25
  }
}
```

### Test Generic LLM

```bash
curl http://localhost:5001/api/chatbot/test-huggingface
```

### Test All Models Together

Make a risk calculation request - it will use all enabled models:

```bash
curl -X POST http://localhost:5001/api/risk-assessment/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "age": 45,
    "gender": "male",
    "systolicBP": 140,
    "cholesterol": 220
  }'
```

## API Endpoints

### Risk Assessment

**POST** `/api/risk-assessment/calculate`
- Uses: Framingham + PREVENT + Sarah0022 (if enabled)
- Query params: `useSarahModel=true/false` to override default

**POST** `/api/chatbot/calculate-risk`
- Uses: All enabled models
- Calculates risk from chatbot collected data

### Model Testing

**GET** `/api/chatbot/test-sarah-model`
- Tests Sarah0022/heart-disease-model connectivity

**GET** `/api/chatbot/test-huggingface`
- Tests generic LLM connectivity

## Model Results Structure

When multiple models are used, results include:

```json
{
  "riskScore": 25,
  "riskPercentage": 12.5,
  "category": "moderate",
  "models": {
    "framingham": { ... },
    "prevent": { ... },
    "sarah0022": { ... }
  },
  "modelCount": 3
}
```

## Benefits of Multiple Models

✅ **Higher Accuracy** - Averaging multiple models reduces individual model biases  
✅ **Reliability** - If one model fails, others continue working  
✅ **Comprehensive Assessment** - Different models capture different risk factors  
✅ **Flexibility** - Enable/disable models based on availability  

## Troubleshooting

### Sarah0022 Model Not Working?

**Possible reasons:**
1. Model may not be available via Inference API
2. Model may require different input format
3. Model may need local execution

**Solution:**
- Check model page: https://huggingface.co/Sarah0022/heart-disease-model
- Disable if needed: `USE_HEART_DISEASE_MODEL=false`
- System will still work with Framingham + PREVENT models

### Model Conflicts?

**No conflicts!** Models are designed to work together:
- Traditional models provide baseline risk
- ML models add additional insights
- Results are averaged for consensus

## Can I Use Only One Model?

Yes! You can:

1. **Use only traditional models**: Set `USE_HEART_DISEASE_MODEL=false`
2. **Use only Sarah0022 model**: Modify code to skip traditional models
3. **Use all models** (recommended): Keep all enabled

The system gracefully handles any combination.

## Performance

- **Multiple models**: Slightly slower but more accurate
- **Single model**: Faster but less comprehensive
- **Fallbacks**: Always available if models fail

## Best Practices

1. **Enable Sarah0022 model** if available (better predictions)
2. **Keep generic LLM enabled** for better conversation
3. **Use all models together** for maximum accuracy
4. **Monitor model availability** and have fallbacks ready

The system is designed to work with any combination of models - mix and match as needed!

