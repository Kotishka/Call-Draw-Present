# Quick Start Guide 🚀

Get Call, Draw, Present running in under 5 minutes!

## Local Development

### Step 1: Install Dependencies

```bash
# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Step 2: Run Both Servers

**Option A: Run both with one command (recommended)**
```bash
npm install npm-run-all -D
npm run dev
```

**Option B: Run separately in two terminals**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm start
```

### Step 3: Play!

1. Open http://localhost:3000
2. Click "Start New Game"
3. Enter your name and create a game
4. Share the 6-character code with friends
5. Start playing when everyone joins!

## Deployment (GitHub + Render)

### 1. Push to GitHub

```bash
git add .
git commit -m "Restructured app with Socket.IO backend"
git push origin master
```

### 2. Deploy Backend to Render

1. Go to https://render.com/
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Configure:
   - **Name**: `call-draw-present-api`
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click "Create Web Service"
7. Copy the URL (e.g., `https://call-draw-present-api.onrender.com`)
8. Add Environment Variable:
   - **Key**: `CLIENT_URL`
   - **Value**: (leave blank for now, we'll update after frontend deployment)

### 3. Deploy Frontend to Render

1. In Render, click "New +" → "Static Site"
2. Select your repository
3. Configure:
   - **Name**: `call-draw-present`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variable:
   - **Key**: `REACT_APP_SERVER_URL`
   - **Value**: Your backend URL from step 2 (e.g., `https://call-draw-present-api.onrender.com`)
5. Click "Create Static Site"
6. Copy the URL (e.g., `https://call-draw-present.onrender.com`)

### 4. Update Backend CORS

1. Go back to your backend service in Render
2. Add/Update Environment Variable:
   - **Key**: `CLIENT_URL`
   - **Value**: Your frontend URL from step 3 (e.g., `https://call-draw-present.onrender.com`)
3. Save and redeploy

### 5. Done! 🎉

Your app is now live! Share the frontend URL with friends and start playing.

## Alternative: Deploy to Railway

### Backend
```bash
cd server
npm install -g @railway/cli
railway login
railway init
railway up
# Copy the provided URL
```

### Frontend
1. Build the app: `npm run build`
2. Deploy the `build` folder to Netlify, Vercel, or GitHub Pages

## Troubleshooting

**"Can't connect to server"**
- Make sure both frontend and backend are running
- Check that `REACT_APP_SERVER_URL` points to the correct backend URL
- Verify CORS settings allow your frontend domain

**"Game not found"**
- Games are stored in memory and cleared after 1 hour
- Make sure you're using the correct game code (case-sensitive)

**Drawing not working**
- Check that you're on the correct round type (drawing rounds are even-numbered)
- Try refreshing the page

## Tips

- **Minimum 3 players** required to start a game
- Games are **automatically cleaned up** after 1 hour of inactivity
- Use **Chrome or Firefox** for best compatibility
- **Mobile drawing** works but desktop is recommended

## Need Help?

Check the main README.md for detailed documentation and deployment options.
