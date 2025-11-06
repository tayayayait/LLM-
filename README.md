<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RO-mn8nlqLqA8TteChaZMAyv-zd_yFYb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_BACKEND_URL` in [.env.local](.env.local) to the LangChain backend REST base URL (e.g. `http://localhost:8000`).
   API keys should be stored and managed exclusively by the backend service.
3. Run the app:
   `npm run dev`
