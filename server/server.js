const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// In-memory storage
const games = new Map();
const players = new Map();

// Generate cryptographically random game code
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', games: games.size, players: players.size });
});

app.post('/api/game/create', (req, res) => {
  const { hostName, maxRounds, minPlayers } = req.body;

  // Validation
  if (!hostName || !hostName.trim()) {
    return res.status(400).json({ error: 'Host name is required' });
  }

  const validatedMaxRounds = maxRounds && maxRounds >= 3 && maxRounds <= 10 ? maxRounds : 6;
  const validatedMinPlayers = minPlayers && minPlayers >= 2 && minPlayers <= 10 ? minPlayers : 3;

  const gameCode = generateGameCode();

  const game = {
    code: gameCode,
    hostId: null,
    status: 'WAITING',
    currentRound: 0,
    maxRounds: validatedMaxRounds,
    minPlayers: validatedMinPlayers,
    players: [],
    submissions: [],
    createdAt: new Date().toISOString()
  };

  games.set(gameCode, game);
  res.json({ game });
});

app.get('/api/game/:code', (req, res) => {
  const game = games.get(req.params.code.toUpperCase());
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json({ game });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join game
  socket.on('joinGame', ({ gameCode, playerName }) => {
    // Prevent same socket from joining twice
    if (players.has(socket.id)) {
      socket.emit('error', { message: 'You are already in a game.' });
      return;
    }

    // Validation
    if (!gameCode || !gameCode.trim()) {
      socket.emit('error', { message: 'Game code is required' });
      return;
    }

    if (!playerName || !playerName.trim()) {
      socket.emit('error', { message: 'Player name is required' });
      return;
    }

    const game = games.get(gameCode.toUpperCase());

    if (!game) {
      socket.emit('error', { message: 'Game not found. Please check the game code.' });
      return;
    }

    if (game.status !== 'WAITING') {
      socket.emit('error', { message: 'Game has already started. Cannot join.' });
      return;
    }

    // Check if player name is already taken
    const nameExists = game.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
    if (nameExists) {
      socket.emit('error', { message: 'This name is already taken. Please choose a different name.' });
      return;
    }

    const playerId = uuidv4();
    const player = {
      id: playerId,
      socketId: socket.id,
      name: playerName.trim(),
      gameCode: gameCode.toUpperCase(),
      isHost: game.players.length === 0,
      isReady: false,
      order: game.players.length,
      joinedAt: new Date().toISOString()
    };

    if (player.isHost) {
      game.hostId = playerId;
    }

    game.players.push(player);
    players.set(socket.id, player);

    socket.join(gameCode.toUpperCase());

    // Send player info to the joining player
    socket.emit('playerJoined', { player, game });

    // Notify all players in the game
    io.to(gameCode.toUpperCase()).emit('playersUpdate', {
      players: game.players
    });

    console.log(`Player ${playerName} joined game ${gameCode}`);
  });

  // Start game
  socket.on('startGame', ({ gameCode }) => {
    const game = games.get(gameCode.toUpperCase());
    const player = players.get(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (!player) {
      socket.emit('error', { message: 'Player not found. Please rejoin the game.' });
      return;
    }

    if (!player.isHost) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    const minPlayers = game.minPlayers || 3;
    if (game.players.length < minPlayers) {
      socket.emit('error', { message: `Need at least ${minPlayers} players to start` });
      return;
    }

    game.status = 'IN_PROGRESS';
    game.currentRound = 1;

    io.to(gameCode.toUpperCase()).emit('gameStarted', { game });
    console.log(`Game ${gameCode} started with ${game.players.length} players`);
  });

  // Submit text or drawing
  socket.on('submitContent', ({ gameCode, type, content, imageData }) => {
    const game = games.get(gameCode.toUpperCase());
    const player = players.get(socket.id);

    if (!game || !player) {
      socket.emit('error', { message: 'Invalid game or player' });
      return;
    }

    // Validate submission type
    if (type !== 'TEXT' && type !== 'DRAWING') {
      socket.emit('error', { message: 'Invalid submission type' });
      return;
    }

    // Validate input size to prevent payload abuse
    if (type === 'TEXT' && content && content.length > 1000) {
      socket.emit('error', { message: 'Text submission is too long (max 1000 characters)' });
      return;
    }
    if (type === 'DRAWING' && imageData && imageData.length > 2_000_000) {
      socket.emit('error', { message: 'Drawing submission is too large' });
      return;
    }

    const submission = {
      id: uuidv4(),
      playerId: player.id,
      playerName: player.name,
      round: game.currentRound,
      type: type,
      content: content,
      imageData: imageData,
      submittedAt: new Date().toISOString()
    };

    game.submissions.push(submission);

    // Check if all players have submitted for this round
    const roundSubmissions = game.submissions.filter(s => s.round === game.currentRound);

    if (roundSubmissions.length === game.players.length) {
      // Move to next round
      if (game.currentRound < game.maxRounds) {
        game.currentRound++;
        io.to(gameCode.toUpperCase()).emit('nextRound', {
          game,
          round: game.currentRound
        });
      } else {
        // Game complete
        game.status = 'COMPLETED';
        io.to(gameCode.toUpperCase()).emit('gameComplete', {
          game,
          submissions: game.submissions
        });
      }
    } else {
      // Notify that a submission was received
      io.to(gameCode.toUpperCase()).emit('submissionReceived', {
        playerName: player.name,
        submitted: roundSubmissions.length,
        total: game.players.length
      });
    }

    console.log(`Player ${player.name} submitted ${type} for round ${game.currentRound}`);
  });

  // Get previous submission (for current player's turn)
  socket.on('getPreviousSubmission', ({ gameCode }) => {
    const game = games.get(gameCode.toUpperCase());
    const player = players.get(socket.id);

    if (!game || !player) {
      socket.emit('error', { message: 'Invalid game or player' });
      return;
    }

    // Get the previous player's submission from the previous round
    const previousRound = game.currentRound - 1;
    if (previousRound > 0) {
      const previousPlayerOrder = (player.order - 1 + game.players.length) % game.players.length;
      const previousPlayer = game.players.find(p => p.order === previousPlayerOrder);

      if (previousPlayer) {
        const previousSubmission = game.submissions.find(
          s => s.playerId === previousPlayer.id && s.round === previousRound
        );

        if (previousSubmission) {
          socket.emit('previousSubmission', { submission: previousSubmission });
        }
      }
    }
  });

  // Get game results
  socket.on('getResults', ({ gameCode }) => {
    const game = games.get(gameCode.toUpperCase());

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    socket.emit('gameResults', {
      game,
      submissions: game.submissions,
      players: game.players
    });
  });

  // Player disconnect
  socket.on('disconnect', () => {
    const player = players.get(socket.id);

    if (player) {
      const game = games.get(player.gameCode);

      if (game) {
        // Remove player from game
        game.players = game.players.filter(p => p.id !== player.id);

        // Notify remaining players
        io.to(player.gameCode).emit('playerLeft', {
          playerName: player.name,
          players: game.players
        });
      }

      players.delete(socket.id);
      console.log(`Player ${player.name} disconnected`);
    }
  });
});

// Cleanup old games every hour
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  for (const [code, game] of games.entries()) {
    const createdAt = new Date(game.createdAt).getTime();
    if (createdAt < oneHourAgo && game.players.length === 0) {
      games.delete(code);
      console.log(`Cleaned up old game ${code}`);
    }
  }
}, 3600000); // Run every hour

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
