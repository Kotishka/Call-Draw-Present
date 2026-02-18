# Call, Draw, Present 🎨✏️

A multiplayer web-based telephone game where players alternate between writing phrases and drawing pictures. Watch as messages transform through creative interpretation!

## 🎮 How It Works

1. **Start a Game**: The host creates a new game and shares the game code with friends
2. **Write a Phrase**: Players start by writing a fun phrase or sentence
3. **Draw It**: The next player views the phrase and draws a picture representing it
4. **Describe It**: Another player views the drawing and writes what they think it is
5. **Repeat**: Continue alternating between drawing and writing
6. **Reveal**: See how much the original phrase changed through the chain!

## 🚀 Features

- ✨ Real-time multiplayer using Socket.IO
- 🎨 HTML5 canvas for drawing with customizable colors and brush sizes
- 🔗 Easy game joining with 6-character codes
- 📱 Responsive design for desktop and mobile
- 🚫 No authentication required - just enter your name and play
- 💾 No database needed - games stored in memory
- ⚡ Fast and lightweight

## 🛠️ Tech Stack

**Frontend:**
- React 18
- React Router 6
- React Bootstrap 5
- Socket.IO Client
- HTML5 Canvas

**Backend:**
- Node.js
- Express
- Socket.IO
- In-memory game state

## 📦 Installation & Setup

### Prerequisites
- Node.js 14+ installed
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd Call-Draw-Present
```

### 2. Install client dependencies
```bash
npm install
```

### 3. Install server dependencies
```bash
cd server
npm install
cd ..
```

### 4. Run locally

**Terminal 1 - Start the backend:**
```bash
cd server
npm run dev
```
The server will run on http://localhost:5000

**Terminal 2 - Start the frontend:**
```bash
npm start
```
The app will open at http://localhost:3000

## 🌐 Deployment

### Option 1: Deploy to Render (Recommended - Free Tier Available)

**Backend Deployment:**
1. Push your code to GitHub
2. Go to [Render Dashboard](https://render.com)
3. Create a new "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Add environment variable:
   - `CLIENT_URL`: Your frontend URL (e.g., `https://your-app.onrender.com`)
7. Deploy!

**Frontend Deployment:**
1. In Render, create a new "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add environment variable:
   - `REACT_APP_SERVER_URL`: Your backend URL (e.g., `https://your-api.onrender.com`)
5. Deploy!

### Option 2: Deploy to Railway

**Backend:**
```bash
cd server
railway login
railway init
railway up
```

**Frontend:**
Build the app and deploy the `build` folder to any static hosting service.

### Option 3: Deploy to Heroku

**Backend:**
1. Create a `Procfile` in the server directory:
   ```
   web: node server.js
   ```
2. Deploy:
   ```bash
   cd server
   heroku create your-app-name
   git push heroku master
   ```

**Frontend:**
Build and deploy to Netlify, Vercel, or GitHub Pages.

### Option 4: Deploy to a VPS (DigitalOcean, Linode, etc.)

1. SSH into your server
2. Install Node.js and npm
3. Clone your repository
4. Install dependencies (both client and server)
5. Build the React app: `npm run build`
6. Use PM2 to run the backend:
   ```bash
   npm install -g pm2
   cd server
   pm2 start server.js --name call-draw-present
   ```
7. Serve the React build folder with nginx or serve it from Express

## 🔧 Environment Variables

**Server (.env in server directory):**
```env
PORT=5000
CLIENT_URL=http://localhost:3000
```

**Client (.env in root directory):**
```env
REACT_APP_SERVER_URL=http://localhost:5000
```

## 📁 Project Structure

```
Call-Draw-Present/
├── server/                    # Backend server
│   ├── server.js             # Express + Socket.IO server
│   └── package.json
├── public/                    # Static files
├── src/
│   ├── components/           # React components
│   │   ├── home.component.js       # Landing page
│   │   ├── newGame.component.js    # Game creation
│   │   └── game.component.js       # Main game interface
│   ├── contexts/             # React contexts
│   │   └── SocketContext.js        # Socket.IO context
│   ├── App.js                # Main app component
│   └── index.js              # Entry point
└── package.json
```

## 🎯 API Endpoints

**REST API:**
- `GET /api/health` - Server health check
- `POST /api/game/create` - Create a new game
- `GET /api/game/:code` - Get game details

**Socket.IO Events:**

*Client → Server:*
- `joinGame` - Join a game room
- `startGame` - Start the game (host only)
- `submitContent` - Submit text or drawing
- `getPreviousSubmission` - Get previous player's submission
- `getResults` - Get game results

*Server → Client:*
- `playerJoined` - Player successfully joined
- `playersUpdate` - Player list updated
- `gameStarted` - Game has started
- `submissionReceived` - Submission acknowledged
- `nextRound` - Move to next round
- `gameComplete` - Game finished
- `playerLeft` - Player disconnected
- `error` - Error message

## 🎮 Game Flow

1. Host creates a game and receives a 6-character code
2. Players join using the code
3. Host starts the game (minimum 3 players)
4. **Round 1 (Text)**: All players write a phrase
5. **Round 2 (Drawing)**: Each player draws the previous player's phrase
6. **Round 3 (Text)**: Each player describes the previous player's drawing
7. Rounds continue alternating until maxRounds is reached
8. Game ends and results are shown

## 🔒 Security Notes

- Games are stored in memory and cleared after 1 hour of inactivity
- No persistent storage means no data leaks
- No authentication required
- CORS enabled for specified client URLs only

## 🐛 Troubleshooting

**Can't connect to server:**
- Check that both frontend and backend are running
- Verify `REACT_APP_SERVER_URL` is set correctly
- Check CORS settings in server.js

**Drawing not working:**
- Ensure you're on a round that requires drawing (even rounds)
- Check browser console for errors
- Try clearing your browser cache

**Players not updating:**
- Check Socket.IO connection in browser DevTools → Network → WS
- Ensure server is running and accessible
- Check firewall settings

## 🚧 Future Enhancements

- [ ] Game results/history page showing full submission chain
- [ ] Timer for each round
- [ ] Touch/mobile drawing support
- [ ] Custom game settings (private rooms, custom round counts)
- [ ] Export game as shareable image
- [ ] Sound effects and animations
- [ ] Voting/rating system for drawings
- [ ] Persistent storage with MongoDB
- [ ] User accounts and stats

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

Built with React, Express, Socket.IO, and Bootstrap.
Inspired by the classic Telephone/Chinese Whispers game and Pictionary.
