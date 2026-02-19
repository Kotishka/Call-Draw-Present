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
- ⏱️ Optional per-round countdown timer with auto-submit on expiry
- 💡 Custom theme prompts to inspire players in round 1
- 🖼️ Export individual chains or the full game as a PNG image
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
- html2canvas (PNG export)

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

The live app is hosted on:
- **Frontend**: [GitHub Pages](https://kotishka.github.io/Call-Draw-Present) — built and deployed automatically via GitHub Actions on every push to `master`
- **Backend**: [Render](https://call-draw-present.onrender.com) — deployed from the `server/` directory

To deploy your own instance:
1. Deploy the `server/` folder to any Node.js host (Render, Railway, Fly.io, etc.) and note the URL
2. Set the `CLIENT_URL` environment variable on the server to your frontend origin
3. Set `REACT_APP_SERVER_URL` in your CI/CD environment (or `.env.production`) to the backend URL
4. Build and deploy the React app to any static host

## 🔧 Environment Variables

**Server (`server/.env`):**
```env
PORT=5000
CLIENT_URL=http://localhost:3000
```

**Client (`.env.local` or CI environment):**
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
│   │   ├── newGame.component.js    # Game creation & lobby
│   │   ├── game.component.js       # Main game interface
│   │   ├── results.component.js    # Storyboard results view
│   │   └── ExportButton.js         # PNG export button
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
- `timerUpdate` - Countdown tick (when timer is enabled)
- `submissionReceived` - Submission acknowledged
- `nextRound` - Move to next round
- `gameComplete` - Game finished
- `playerLeft` - Player disconnected
- `error` - Error message

## 🎮 Game Flow

1. Host creates a game and receives a 6-character code
2. Players join using the code
3. Host starts the game (minimum 3 players by default)
4. **Round 1 (Text)**: All players write a phrase (optional theme prompt shown)
5. **Round 2 (Drawing)**: Each player draws the previous player's phrase
6. **Round 3 (Text)**: Each player describes the previous player's drawing
7. Rounds continue alternating until maxRounds is reached
8. Game ends and results are shown as a storyboard

## 🔒 Security Notes

- Games are stored in memory and cleared after 1 hour of inactivity
- No persistent storage means no data leaks
- No authentication required
- CORS restricted to the configured client URL

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

- [ ] Touch/mobile drawing support improvements
- [ ] Sound effects and animations
- [ ] Voting/rating system for drawings
- [ ] Persistent storage with MongoDB
- [ ] User accounts and stats

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

Built with React, Express, Socket.IO, and Bootstrap.
Inspired by the classic Telephone/Chinese Whispers game and Pictionary.
