# Daksh-Bharat Deployment Guide

This project is a full-stack application with a React frontend (Vite) and a Node.js/Express backend. It is designed to be hosted on platforms like **Render**, **Railway**, or **Heroku**.

## Prerequisites
- A GitHub account with the project pushed to a repository.
- A free account on [Render](https://render.com/) (Recommended for easy setup).
- A managed MySQL database (e.g., [Aiven](https://aiven.io/mysql) or [PlanetScale](https://planetscale.com/)).

## Deployment Steps (using Render)

### 1. Database Setup
- Create a MySQL database on your preferred provider.
- Get your connection details: `Host`, `User`, `Password`, and `Database Name`.

### 2. Create a Web Service on Render
- Log in to Render and click **New > Web Service**.
- Connect your GitHub repository.
- Configure the service:
  - **Name**: `daksh-bharat`
  - **Environment**: `Node`
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm start`

### 3. Add Environment Variables
In the **Environment** tab of your Render service, add the following variables:
- `PORT`: `3001`
- `DB_HOST`: Your MySQL host.
- `DB_USER`: Your MySQL username.
- `DB_PASSWORD`: Your MySQL password.
- `DB_NAME`: Your MySQL database name.
- `JWT_SECRET`: A random secure string (e.g., `8f2d...`).
- `OPENAI_API_KEY`: Your OpenAI key for AI features.
- `TWILIO_ACCOUNT_SID`: (Optional) For real SMS.
- `TWILIO_AUTH_TOKEN`: (Optional) For real SMS.
- `TWILIO_PHONE_NUMBER`: (Optional) For real SMS.

### 4. Deploy
- Click **Create Web Service**.
- Render will build the frontend, move it to the `dist` folder, and start the Node.js server.
- Your app will be live at `https://your-app-name.onrender.com`.

## Production Architecture
- **Single Server**: The Node.js server serves both the API (`/api/*`) and the static React files for all other routes.
- **Resilience**: The frontend is configured with relative API paths, making it easy to host on any domain without manual URL changes.
- **Database**: The server automatically initializes the MySQL schema on its first run using the provided credentials.

---
*Generated for Shritej Betkar's Daksh-Bharat Project*
