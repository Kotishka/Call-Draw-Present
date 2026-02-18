# Call, Draw, Present - Server

Node.js/Express backend with Socket.IO for real-time multiplayer gameplay.

## Features

- 🚀 Real-time communication via Socket.IO
- 💾 In-memory game state (no database required)
- 🔄 Automatic game cleanup after 1 hour
- 🔒 CORS protection
- ⚡ Lightweight and fast

## API Endpoints

### REST API

**GET /api/health**
- Health check endpoint
- Returns server status and active games/players count

**POST /api/game/create**
- Create a new game
- Body: `{ hostName: string, maxRounds: number }`
- Returns: `{ game: Game }`

**GET /api/game/:code**
- Get game details by code
- Returns: `{ game: Game }`

### Socket.IO Events

#### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `joinGame` | `{ gameCode, playerName }` | Join a game room |
| `startGame` | `{ gameCode }` | Start the game (host only) |
| `submitContent` | `{ gameCode, type, content, imageData }` | Submit text or drawing |
| `getPreviousSubmission` | `{ gameCode }` | Get previous player's submission |
| `getResults` | `{ gameCode }` | Get game results |

#### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `playerJoined` | `{ player, game }` | Confirmation of successful join |
| `playersUpdate` | `{ players }` | Updated player list |
| `gameStarted` | `{ game }` | Game has started |
| `previousSubmission` | `{ submission }` | Previous player's submission |
| `submissionReceived` | `{ playerName, submitted, total }` | Submission acknowledged |
| `nextRound` | `{ game, round }` | Move to next round |
| `gameComplete` | `{ game, submissions }` | Game finished |
| `playerLeft` | `{ playerName, players }` | Player disconnected |
| `error` | `{ message }` | Error message |

## Environment Variables

```env
PORT=5000                           # Server port
CLIENT_URL=http://localhost:3000    # Frontend URL for CORS
```

## Development

```bash
# Install dependencies
npm install

# Run with auto-reload
npm run dev

# Run in production
npm start
```

## Data Models

### Game
```javascript
{
  id: string,           // UUID
  code: string,         // 6-character code
  hostId: string,       // Host player ID
  status: string,       // 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  currentRound: number, // Current round number
  maxRounds: number,    // Total number of rounds
  players: Player[],    // Array of players
  submissions: Submission[], // Array of submissions
  createdAt: string     // ISO timestamp
}
```

### Player
```javascript
{
  id: string,           // UUID
  socketId: string,     // Socket.IO connection ID
  name: string,         // Player name
  gameCode: string,     // Game code
  isHost: boolean,      // Is game host
  isReady: boolean,     // Is ready to play
  order: number,        // Player order in game
  joinedAt: string      // ISO timestamp
}
```

### Submission
```javascript
{
  id: string,           // UUID
  playerId: string,     // Player ID
  playerName: string,   // Player name
  round: number,        // Round number
  type: string,         // 'TEXT' | 'DRAWING'
  content: string,      // Text content or description
  imageData: string,    // Base64 image data (for drawings)
  submittedAt: string   // ISO timestamp
}
```

## Game Logic

1. Host creates a game → receives 6-character code
2. Players join using code → stored in game.players array
3. Host starts game → game.status changes to 'IN_PROGRESS'
4. Round 1: All players submit text
5. Once all submit → automatically advance to round 2
6. Round 2: All players submit drawings
7. Continue alternating text/drawing rounds
8. When currentRound reaches maxRounds → game.status changes to 'COMPLETED'

## Cleanup

- Games with 0 players are deleted after 1 hour
- Scheduled cleanup runs every hour
- Player disconnect triggers immediate cleanup check

## Scaling Considerations

Current implementation uses in-memory storage. For production scale:

- Add Redis for distributed game state
- Use Redis pub/sub for Socket.IO scaling across multiple servers
- Implement Socket.IO adapter for multi-server support
- Add persistent storage (MongoDB/PostgreSQL) for game history

## Security

- CORS restricted to specified CLIENT_URL
- No authentication (stateless, session-based gameplay)
- Input validation on all endpoints
- Rate limiting recommended for production

## Deployment

See main README.md for deployment instructions to:
- Render
- Railway
- Heroku
- VPS (DigitalOcean, Linode, etc.)
