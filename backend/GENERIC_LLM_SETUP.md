# Generic LLM Setup Guide

The chatbot now supports using a generic LLM for more natural conversational responses while maintaining the improved rule-based fallback system.

## Current Status

✅ **Generic LLM is enabled** by default with `USE_GENERIC_LLM=true`

The system uses a **hybrid approach**:
1. **First**: Tries to use generic LLM for natural responses
2. **Fallback**: If LLM fails, uses improved rule-based system (includes ranges, "I don't know" handling, etc.)
3. **Always works**: Even if LLM fails, the fallback system ensures the chatbot functions properly

## Configuration

In your `.env` file:

```bash
USE_GENERIC_LLM=true
FALLBACK_LLM_MODEL=microsoft/DialoGPT-medium
```

## Available Models

### Free Models (Recommended)
These typically work without additional setup:
- `microsoft/DialoGPT-medium` (default) - Good for conversations
- `gpt2` - Basic but reliable
- `google/flan-t5-xxl` - Good for instruction following

### Premium Models (May require Inference Provider setup)
These may require additional configuration or paid plans:
- `meta-llama/Meta-Llama-3.1-8B-Instruct` - Very capable but may need provider setup
- `mistralai/Mistral-7B-Instruct-v0.2` - Excellent conversational model
- `microsoft/Phi-3-mini-4k-instruct` - Fast and efficient

## How It Works

1. **User sends a message** → System checks if generic LLM is enabled
2. **If enabled**: Tries to get response from LLM (tries chatCompletion, then textGeneration)
3. **If LLM succeeds**: Uses AI-generated response
4. **If LLM fails**: Automatically falls back to improved rule-based system
5. **User always gets a response**: Either from LLM or rule-based fallback

## Features

The generic LLM enhances:
- **Natural conversation**: More varied and contextual responses
- **Handling unexpected inputs**: Better at understanding different phrasings
- **Conversational flow**: More human-like interactions

The fallback system ensures:
- **Reliability**: Always works even if LLM fails
- **Structured data collection**: Properly collects all health metrics
- **Range information**: Shows normal ranges for health metrics
- **"I don't know" handling**: Gracefully handles uncertainty
- **Error recovery**: Works even with API issues

## Troubleshooting

### LLM Not Working?

If you see errors like:
- "Failed to perform inference: an HTTP error occurred"
- "No Inference Provider available"
- "Model not supported"

**This is normal!** The fallback system will automatically take over and the chatbot will still work perfectly.

### To Disable LLM

Set in `.env`:
```bash
USE_GENERIC_LLM=false
```

The improved rule-based fallback system will handle everything.

### To Try Different Models

Update `FALLBACK_LLM_MODEL` in `.env`:
```bash
FALLBACK_LLM_MODEL=gpt2
# or
FALLBACK_LLM_MODEL=google/flan-t5-xxl
```

Then restart the server.

## Testing

Test the generic LLM:
```bash
curl -X POST http://localhost:5001/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I want to check my heart risk", "sessionId": "test"}'
```

Check logs to see if LLM is being used:
```bash
tail -f /tmp/backend.log | grep LLM
```

Look for:
- `✓ Generic LLM response received` - LLM worked!
- `Generic LLM chatCompletion failed` - Falling back to rule-based

## Benefits

✅ **Best of both worlds**: Natural LLM responses when available, reliable fallback always
✅ **No downtime**: System always works even if LLM API has issues
✅ **Configurable**: Easy to enable/disable or switch models
✅ **Improved UX**: Better handling of various input types when LLM works

The system is designed to gracefully degrade - if the LLM isn't available, you still get the full functionality through the improved fallback system!

