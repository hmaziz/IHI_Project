# Hugging Face Setup Guide

This backend now uses Hugging Face instead of OpenAI for the chatbot functionality.

## Model Information

**Model**: `featherless-ai-quants/nztinversive-llama3.2-1B-HeartDiseasePrediction-GGUF`

This is a GGUF-quantized Llama 3.2 model specifically fine-tuned for heart disease prediction.

## Setup Instructions

### 1. Get Your Hugging Face API Key

1. Go to https://huggingface.co/settings/tokens
2. Create a new access token (read access is sufficient)
3. Copy the token (it starts with `hf_`)

### 2. Update Environment Variables

Update your `backend/.env` file:

```bash
PORT=5000
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
# Alternative: HF_TOKEN=your_huggingface_api_key_here
FHIR_SERVER_URL=http://localhost:8080/fhir
NODE_ENV=development
```

Replace `your_huggingface_api_key_here` with your actual Hugging Face API token.

### 3. Install Dependencies

The Hugging Face Inference package should already be installed:

```bash
cd backend
npm install
```

### 4. Test the Integration

#### Option A: Test via API Endpoint

1. Start the server:
```bash
npm start
```

2. Test the endpoint:
```bash
curl http://localhost:5001/api/chatbot/test-huggingface
```

Expected response (success):
```json
{
  "success": true,
  "message": "Hugging Face API key is valid and model is accessible",
  "apiKeyConfigured": true,
  "modelName": "featherless-ai-quants/nztinversive-llama3.2-1B-HeartDiseasePrediction-GGUF",
  "testResponse": "...",
  "timestamp": "..."
}
```

#### Option B: Run Tests

```bash
npm run test:hf
```

Or run all tests:
```bash
npm test
```

## Important Notes

### GGUF Model Limitations

**Important**: GGUF models are quantized model formats typically designed for local execution with tools like `llama.cpp`. They may **not** be directly available via Hugging Face's Inference API.

If you get a 404 error or "Model not found" response:

1. **Check if the model is available via Inference API**: Visit the model page on Hugging Face and check if it supports Inference API.

2. **Alternative Options**:
   - **Use a different model**: If the model isn't available via API, you might need to use a different model that supports the Inference API
   - **Local execution**: Set up local model execution using `llama.cpp` or Python with `llama-cpp-python`
   - **Use a compatible model**: Consider using a non-GGUF version if available, or another model that supports Inference API

3. **Fallback Behavior**: The code includes a fallback mechanism that will use rule-based responses if the model isn't available.

### Model Availability Check

To check if the model is available via Inference API:

```bash
curl https://api-inference.huggingface.co/models/featherless-ai-quants/nztinversive-llama3.2-1B-HeartDiseasePrediction-GGUF \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## API Endpoints

### Test Hugging Face Connection
```
GET /api/chatbot/test-huggingface
```

### Chatbot Message
```
POST /api/chatbot/message
Body: {
  "message": "Hello",
  "sessionId": "optional-session-id",
  "patientData": {},
  "conversationHistory": []
}
```

### Start Chatbot Session
```
POST /api/chatbot/start
Body: {
  "sessionId": "optional-session-id"
}
```

## Troubleshooting

### Error: "Hugging Face API key is invalid"

- Verify your API key is correct
- Check that it starts with `hf_`
- Make sure there are no extra spaces in your `.env` file
- Restart the server after updating `.env`

### Error: "Model not found via Inference API"

This is expected for GGUF models. Options:
1. Check if there's a non-GGUF version available
2. Set up local model execution
3. The fallback system will handle basic interactions

### Error: "Rate limit exceeded"

- Free tier has rate limits
- Wait a few minutes and try again
- Consider upgrading your Hugging Face plan

### Model Not Responding

The code includes a fallback mechanism:
- If the model fails, it will use rule-based responses
- Basic conversation flow will still work
- Check server logs for detailed error messages

## Migration from OpenAI

If you were previously using OpenAI:

1. ✅ Remove `OPENAI_API_KEY` from `.env`
2. ✅ Add `HUGGINGFACE_API_KEY` to `.env`
3. ✅ Update all API calls to use the new endpoint
4. ✅ Test with `npm run test:hf`

## Resources

- [Hugging Face Inference API Docs](https://huggingface.co/docs/api-inference/index)
- [Hugging Face Models](https://huggingface.co/models)
- [Get API Token](https://huggingface.co/settings/tokens)
- [Model Page](https://huggingface.co/featherless-ai-quants/nztinversive-llama3.2-1B-HeartDiseasePrediction-GGUF)

