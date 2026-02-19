const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage
const games = new Map();
const players = new Map();

// Blank white 1x1 PNG as data URL for auto-submitted drawings
const BLANK_CANVAS_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

// Strip server-only fields before sending game state to clients
function sanitizeGameForClient(game) {
  const { activeTimers, ...rest } = game;
  return rest;
}

// Generate random game code
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Advance to next round or end the game
function advanceRoundOrEnd(gameCode) {
  const game = games.get(gameCode);
  if (!game) return;

  if (game.currentRound < game.maxRounds) {
    game.currentRound++;
    io.to(gameCode).emit('nextRound', {
      game: sanitizeGameForClient(game),
      round: game.currentRound
    });
    startRoundTimer(gameCode, game.currentRound);
  } else {
    game.status = 'COMPLETED';
    Object.values(game.activeTimers || {}).forEach(id => clearInterval(id));
    game.activeTimers = {};
    io.to(gameCode).emit('gameComplete', {
      game: sanitizeGameForClient(game),
      submissions: game.submissions
    });
  }
}

// Auto-submit placeholder entries for players who haven't submitted yet
function autoSubmitMissingPlayers(gameCode, roundNumber) {
  const game = games.get(gameCode);
  if (!game || game.currentRound !== roundNumber) return;

  const roundSubmissions = game.submissions.filter(s => s.round === roundNumber);
  const submittedPlayerIds = new Set(roundSubmissions.map(s => s.playerId));
  const isTextRound = roundNumber % 2 === 1;

  for (const player of game.players) {
    if (!submittedPlayerIds.has(player.id)) {
      game.submissions.push({
        id: uuidv4(),
        playerId: player.id,
        playerName: player.name,
        round: roundNumber,
        type: isTextRound ? 'TEXT' : 'DRAWING',
        content: isTextRound ? '(time ran out)' : 'Time ran out',
        imageData: isTextRound ? null : BLANK_CANVAS_DATA_URL,
        submittedAt: new Date().toISOString(),
        autoSubmitted: true
      });
    }
  }

  advanceRoundOrEnd(gameCode);
}

// Start server-driven round timer
function startRoundTimer(gameCode, roundNumber) {
  const game = games.get(gameCode);
  if (!game || !game.timerDuration) return;

  let secondsLeft = game.timerDuration;

  // Emit immediately so clients show full timer on round start
  io.to(gameCode).emit('timerUpdate', { secondsLeft, roundNumber });

  const intervalId = setInterval(() => {
    secondsLeft--;
    io.to(gameCode).emit('timerUpdate', { secondsLeft, roundNumber });

    if (secondsLeft <= 0) {
      clearInterval(intervalId);
      delete game.activeTimers[roundNumber];
      autoSubmitMissingPlayers(gameCode, roundNumber);
    }
  }, 1000);

  game.activeTimers[roundNumber] = intervalId;
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', games: games.size, players: players.size });
});

app.post('/api/game/create', (req, res) => {
  const { hostName, maxRounds, minPlayers, timerDuration } = req.body;

  if (!hostName || !hostName.trim()) {
    return res.status(400).json({ error: 'Host name is required' });
  }

  const validatedMaxRounds = maxRounds && maxRounds >= 3 && maxRounds <= 10 ? maxRounds : 6;
  const validatedMinPlayers = minPlayers && minPlayers >= 2 && minPlayers <= 10 ? minPlayers : 3;
  const validTimerValues = [30, 60, 90, 120];
  const validatedTimerDuration = validTimerValues.includes(timerDuration) ? timerDuration : null;

  const gameCode = generateGameCode();
  const gameId = uuidv4();

  const game = {
    id: gameId,
    code: gameCode,
    hostId: null,
    status: 'WAITING',
    currentRound: 0,
    maxRounds: validatedMaxRounds,
    minPlayers: validatedMinPlayers,
    timerDuration: validatedTimerDuration,
    players: [],
    submissions: [],
    activeTimers: {},
    createdAt: new Date().toISOString()
  };

  games.set(gameCode, game);
  res.json({ game: sanitizeGameForClient(game) });
});

app.get('/api/game/:code', (req, res) => {
  const game = games.get(req.params.code.toUpperCase());
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json({ game: sanitizeGameForClient(game) });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join game
  socket.on('joinGame', ({ gameCode, playerName }) => {
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

    socket.emit('playerJoined', { player, game: sanitizeGameForClient(game) });

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

    io.to(gameCode.toUpperCase()).emit('gameStarted', { game: sanitizeGameForClient(game) });
    startRoundTimer(gameCode.toUpperCase(), 1);
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

    const roundSubmissions = game.submissions.filter(s => s.round === game.currentRound);

    if (roundSubmissions.length === game.players.length) {
      // All players submitted - cancel timer early if running
      const timerId = game.activeTimers[game.currentRound];
      if (timerId) {
        clearInterval(timerId);
        delete game.activeTimers[game.currentRound];
      }
      advanceRoundOrEnd(gameCode.toUpperCase());
    } else {
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
      game: sanitizeGameForClient(game),
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
        game.players = game.players.filter(p => p.id !== player.id);

        io.to(player.gameCode).emit('playerLeft', {
          playerName: player.name,
          players: game.players
        });

        if (game.players.length === 0) {
          setTimeout(() => {
            if (games.get(player.gameCode)?.players.length === 0) {
              Object.values(game.activeTimers || {}).forEach(id => clearInterval(id));
              games.delete(player.gameCode);
              console.log(`Deleted empty game ${player.gameCode}`);
            }
          }, 3600000);
        }
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
      Object.values(game.activeTimers || {}).forEach(id => clearInterval(id));
      games.delete(code);
      console.log(`Cleaned up old game ${code}`);
    }
  }
}, 3600000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
