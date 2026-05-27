<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# AI Analytics App

This repository contains a React + Express application that can be deployed to Render or run locally.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env` file and set your Gemini API key:
   `GEMINI_API_KEY=YOUR_GEMINI_API_KEY`
3. Run the app:
   `npm run dev`

## Deploy to Render

1. Set the `Build Command` to:
   `npm install && npm run build`
2. Set the `Start Command` to:
   `npm start`
3. Add the environment variable `GEMINI_API_KEY` in Render.
