# Vercel Deployment Guide

## Configuration Summary

This project has been configured for Vercel deployment with the following setup:

### Project Structure
- **Frontend**: `frontend/` directory (React app)
- **Backend API**: Converted to Vercel serverless functions in `api/` directory
- **Root**: Contains `vercel.json` configuration

## Vercel Settings Configuration

### In Vercel Dashboard, configure the following:

#### 1. Framework Settings
- **Framework Preset**: `Other` (or leave as auto-detected)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm install && cd frontend && npm install && cd ../backend && npm install`
- **Development Command**: Leave as "None"

#### 2. Root Directory
- **Root Directory**: Leave **EMPTY** (root of the repository)
- **Include files outside the root directory in the Build Step**: Enabled

#### 3. Environment Variables
Add the following environment variables in Vercel Dashboard → Settings → Environment Variables:

```
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HF_TOKEN=your_huggingface_api_key_here (if using HF_TOKEN)
USE_GENERIC_LLM=true
FALLBACK_LLM_MODEL=microsoft/DialoGPT-medium
USE_HEART_DISEASE_MODEL=true
HEART_DISEASE_MODEL=Sarah0022/heart-disease-model
FHIR_SERVER_URL=http://localhost:8080/fhir (or your FHIR server URL)
NODE_ENV=production
```

#### 4. Node.js Version
- Set to **Node.js 18.x** or **22.x** (recommended: 18.x for compatibility)

## How It Works

1. **Frontend**: Built from `frontend/` directory and served as static files
2. **API Routes**: All `/api/*` requests are handled by the serverless function at `api/[...path].js`
3. **Routing**: 
   - API requests (`/api/*`) → Serverless function
   - All other requests → Frontend React app (SPA routing)

## Deployment Steps

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Configure the settings as described above
4. Add environment variables
5. Deploy!

## Troubleshooting

### Build Fails
- Check that all dependencies are installed correctly
- Verify Node.js version is set correctly
- Check build logs for specific errors

### API Routes Not Working
- Verify `api/[...path].js` exists
- Check that `serverless-http` is installed in root `package.json`
- Verify environment variables are set correctly
- Check serverless function logs in Vercel dashboard

### Frontend Can't Connect to API
- The frontend uses relative paths (`/api/*`) which should work automatically
- In production, API calls go to the same domain, so no CORS issues
- If issues persist, check browser console for errors

## Notes

- The `setupProxy.js` in frontend is only used in development (with `npm start`)
- In production on Vercel, API calls use the same domain, so no proxy needed
- The backend Express routes are wrapped in a serverless function handler
- State management (like conversation contexts) will work but may have cold start delays

