const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const { Chess } = require('chess.js');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = process.env.PORT || 3000;

// Serve static frontend files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Serve chess.js directly from node_modules (No CDN requirement)
app.get('/vendor/chess.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'node_modules', 'chess.js', 'dist', 'esm', 'chess.js'));
});

// JSON body parsing for API
app.use(express.json());

/**
 * Scan all non-internal IPv4 network interfaces
 */
function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const results = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;
    for (const net of netList) {
      if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
        const isHotspot =
          net.address.startsWith('192.168.137.') ||
          name.toLowerCase().includes('hotspot') ||
          name.toLowerCase().includes('wi-fi direct') ||
          name.toLowerCase().includes('local area connection*');
        results.push({
          interfaceName: name,
          ip: net.address,
          url: `http://${net.address}:${PORT}`,
          isHotspot
        });
      }
    }
  }
  return results;
}

// REST API for LAN URLs
app.get('/api/lan-urls', (req, res) => {
  res.json({
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    addresses: getLanAddresses()
  });
});

// REST API for Game History
app.get('/api/history', (req, res) => {
  try {
    const games = db.getRecentGames(20);
    res.json({ success: true, games });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history/:id', (req, res) => {
  try {
    const game = db.getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// In-Memory active rooms store
const rooms = new Map();

/**
 * Generate a 4-letter uppercase room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

io.on('connection', (socket) => {
  // CREATE ROOM
  socket.on('create_room', ({ playerName, revealCount }) => {
    const name = (playerName || 'Player 1').trim().slice(0, 20);
    const reveals = Math.max(1, Math.min(30, parseInt(revealCount, 10) || 7));
    const roomCode = generateRoomCode();

    const room = {
      code: roomCode,
      revealCount: reveals,
      creatorSocketId: socket.id,
      players: {
        white: {
          socketId: socket.id,
          name: name,
          revealsLeft: reveals,
          revealsUsed: 0,
          connected: true
        },
        black: {
          socketId: null,
          name: null,
          revealsLeft: reveals,
          revealsUsed: 0,
          connected: false
        }
      },
      chess: new Chess(),
      started: false,
      startedAt: null,
      ended: false,
      endedAt: null,
      result: null,
      disconnectTimer: null,
      disconnectedColor: null,
      rematchVotes: new Set(),
      activeReveal: null,
      moveHistory: []
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.color = 'white';
    socket.data.name = name;

    socket.emit('room_created', {
      roomCode,
      color: 'white',
      revealCount: reveals,
      lanUrls: getLanAddresses()
    });
  });

  // JOIN ROOM
  socket.on('join_room', ({ roomCode, playerName }) => {
    const code = (roomCode || '').trim().toUpperCase();
    const name = (playerName || 'Player 2').trim().slice(0, 20);
    const room = rooms.get(code);

    if (!room) {
      return socket.emit('join_error', { message: `Room "${code}" not found. Check the code and try again.` });
    }

    // Check if player is reconnecting
    if (room.started && !room.ended) {
      if (room.players.white.name.toLowerCase() === name.toLowerCase() && !room.players.white.connected) {
        return handleReconnection(socket, room, 'white', name);
      }
      if (room.players.black && room.players.black.name && room.players.black.name.toLowerCase() === name.toLowerCase() && !room.players.black.connected) {
        return handleReconnection(socket, room, 'black', name);
      }
    }

    if (room.started) {
      return socket.emit('join_error', { message: `Game in room "${code}" is already in progress.` });
    }

    if (room.players.black.socketId) {
      return socket.emit('join_error', { message: `Room "${code}" is already full.` });
    }

    // Second player joins as Black
    room.players.black.socketId = socket.id;
    room.players.black.name = name;
    room.players.black.connected = true;
    room.started = true;
    room.startedAt = new Date().toISOString();

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.color = 'black';
    socket.data.name = name;

    // Notify both players that game has started
    io.to(code).emit('game_start', {
      roomCode: code,
      whiteName: room.players.white.name,
      blackName: room.players.black.name,
      revealCount: room.revealCount,
      turn: room.chess.turn(), // 'w'
      fen: room.chess.fen()
    });
  });

  // MAKE MOVE
  socket.on('make_move', ({ roomCode, from, to, promotion, san }) => {
    const code = roomCode || socket.data.roomCode;
    const room = rooms.get(code);

    if (!room || !room.started || room.ended) {
      return socket.emit('move_error', { message: 'No active game in this room.' });
    }

    const playerColor = socket.data.color;
    const currentTurn = room.chess.turn(); // 'w' or 'b'
    const expectedColor = currentTurn === 'w' ? 'white' : 'black';

    if (playerColor !== expectedColor) {
      return socket.emit('move_error', { message: "It's not your turn!" });
    }

    let moveResult = null;
    try {
      if (san) {
        // SAN input e.g. "e4", "Nf3", "O-O"
        moveResult = room.chess.move(san);
      } else if (from && to) {
        // Coordinate input e.g. "e2" to "e4"
        moveResult = room.chess.move({
          from: from.toLowerCase(),
          to: to.toLowerCase(),
          promotion: promotion || 'q'
        });
      }
    } catch (err) {
      return socket.emit('move_error', { message: `Illegal move: ${err.message}` });
    }

    if (!moveResult) {
      return socket.emit('move_error', { message: 'Illegal move!' });
    }

    // Move is valid! Record it
    const ply = room.chess.history().length;
    room.moveHistory.push({
      ply,
      san: moveResult.san,
      from: moveResult.from,
      to: moveResult.to,
      color: moveResult.color
    });

    // Check if player had active reveal, and close it when they move
    if (room.activeReveal && room.activeReveal.byColor === playerColor) {
      room.activeReveal = null;
      io.to(code).emit('reveal_ended', { byColor: playerColor });
    }

    // Check game over
    if (room.chess.isGameOver()) {
      room.ended = true;
      room.endedAt = new Date().toISOString();

      let resultText = 'Game Over';
      let winner = 'draw';

      if (room.chess.isCheckmate()) {
        const winningColor = moveResult.color === 'w' ? 'white' : 'black';
        const winningName = room.players[winningColor].name;
        winner = winningColor;
        resultText = `${winningName} (${winningColor.toUpperCase()}) won by checkmate!`;
      } else if (room.chess.isStalemate()) {
        resultText = 'Draw by stalemate';
      } else if (room.chess.isThreefoldRepetition()) {
        resultText = 'Draw by threefold repetition';
      } else if (room.chess.isInsufficientMaterial()) {
        resultText = 'Draw by insufficient material';
      } else if (room.chess.isDraw()) {
        resultText = 'Draw by 50-move rule';
      }

      room.result = resultText;

      // Save to SQLite
      try {
        db.saveGame({
          room_code: room.code,
          white_name: room.players.white.name,
          black_name: room.players.black.name,
          result: resultText,
          pgn: room.chess.pgn(),
          white_reveals_used: room.players.white.revealsUsed,
          black_reveals_used: room.players.black.revealsUsed,
          started_at: room.startedAt,
          ended_at: room.endedAt
        });
      } catch (e) {
        console.error('Failed to save game to database:', e);
      }

      // Broadcast game_over with FULL final FEN so both players can see the final board dramatically!
      io.to(code).emit('game_over', {
        result: resultText,
        winner,
        fen: room.chess.fen(),
        pgn: room.chess.pgn(),
        lastMove: {
          from: moveResult.from,
          to: moveResult.to,
          san: moveResult.san,
          color: moveResult.color
        },
        whiteRevealsUsed: room.players.white.revealsUsed,
        blackRevealsUsed: room.players.black.revealsUsed
      });
    } else {
      // Normal move: broadcast coordinates, SAN, check state, and FEN
      io.to(code).emit('move_made', {
        from: moveResult.from,
        to: moveResult.to,
        san: moveResult.san,
        color: moveResult.color,
        turn: room.chess.turn(),
        isCheck: room.chess.inCheck(),
        fen: room.chess.fen(),
        ply
      });
    }
  });

  // REQUEST REVEAL - Untimed & visible to BOTH players until player completes their move
  socket.on('request_reveal', ({ roomCode }) => {
    const code = roomCode || socket.data.roomCode;
    const room = rooms.get(code);

    if (!room || !room.started || room.ended) {
      return socket.emit('move_error', { message: 'Game is not active.' });
    }

    const playerColor = socket.data.color;
    if (!playerColor || !room.players[playerColor]) {
      return socket.emit('move_error', { message: 'Player not recognized in this room.' });
    }

    const player = room.players[playerColor];
    if (player.revealsLeft <= 0) {
      return socket.emit('move_error', { message: 'You have no reveals remaining!' });
    }

    if (room.activeReveal && room.activeReveal.byColor === playerColor) {
      return socket.emit('move_error', { message: 'Reveal already active! Make your move to continue.' });
    }

    // Decrement reveals
    player.revealsLeft--;
    player.revealsUsed++;

    room.activeReveal = {
      byColor: playerColor,
      byName: player.name
    };

    // Broadcast active reveal to BOTH players (no timer)
    io.to(code).emit('reveal_active', {
      byColor: playerColor,
      byName: player.name,
      fen: room.chess.fen()
    });

    // Broadcast updated reveal counts to both players
    io.to(code).emit('reveals_update', {
      whiteRevealsLeft: room.players.white.revealsLeft,
      blackRevealsLeft: room.players.black.revealsLeft
    });
  });

  // RESIGN
  socket.on('resign', ({ roomCode }) => {
    const code = roomCode || socket.data.roomCode;
    const room = rooms.get(code);

    if (!room || !room.started || room.ended) return;

    const resigningColor = socket.data.color;
    const winningColor = resigningColor === 'white' ? 'black' : 'white';
    const resigningName = room.players[resigningColor].name;
    const winningName = room.players[winningColor].name;
    const resultText = `${winningName} (${winningColor.toUpperCase()}) won by resignation of ${resigningName}`;

    room.ended = true;
    room.endedAt = new Date().toISOString();
    room.result = resultText;

    try {
      db.saveGame({
        room_code: room.code,
        white_name: room.players.white.name,
        black_name: room.players.black.name,
        result: resultText,
        pgn: room.chess.pgn(),
        white_reveals_used: room.players.white.revealsUsed,
        black_reveals_used: room.players.black.revealsUsed,
        started_at: room.startedAt,
        ended_at: room.endedAt
      });
    } catch (e) {
      console.error('Failed to save resigned game to database:', e);
    }

    io.to(code).emit('game_over', {
      result: resultText,
      winner: winningColor,
      fen: room.chess.fen(),
      pgn: room.chess.pgn(),
      whiteRevealsUsed: room.players.white.revealsUsed,
      blackRevealsUsed: room.players.black.revealsUsed
    });
  });

  // REMATCH REQUEST
  socket.on('request_rematch', ({ roomCode }) => {
    const code = roomCode || socket.data.roomCode;
    const room = rooms.get(code);

    if (!room || !room.ended) return;

    room.rematchVotes.add(socket.id);

    if (room.rematchVotes.size === 1) {
      socket.to(code).emit('opponent_requested_rematch', {
        requesterName: socket.data.name
      });
    } else if (room.rematchVotes.size >= 2) {
      // Both agreed to rematch! Swap colors:
      const prevWhite = room.players.white;
      const prevBlack = room.players.black;

      room.players.white = {
        socketId: prevBlack.socketId,
        name: prevBlack.name,
        revealsLeft: room.revealCount,
        revealsUsed: 0,
        connected: true
      };

      room.players.black = {
        socketId: prevWhite.socketId,
        name: prevWhite.name,
        revealsLeft: room.revealCount,
        revealsUsed: 0,
        connected: true
      };

      // Update socket colors
      const whiteSocket = io.sockets.sockets.get(room.players.white.socketId);
      if (whiteSocket) whiteSocket.data.color = 'white';

      const blackSocket = io.sockets.sockets.get(room.players.black.socketId);
      if (blackSocket) blackSocket.data.color = 'black';

      // Reset chess game
      room.chess = new Chess();
      room.started = true;
      room.startedAt = new Date().toISOString();
      room.ended = false;
      room.endedAt = null;
      room.result = null;
      room.rematchVotes.clear();
      room.moveHistory = [];

      room.activeReveal = null;

      io.to(code).emit('rematch_start', {
        roomCode: code,
        whiteName: room.players.white.name,
        blackName: room.players.black.name,
        revealCount: room.revealCount,
        turn: 'w',
        fen: room.chess.fen()
      });
    }
  });

  // DISCONNECT HANDLING
  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const color = socket.data.color;
    if (!color || !room.players[color]) return;

    room.players[color].connected = false;

    // If game was in progress, give 60 seconds to reconnect
    if (room.started && !room.ended) {
      room.disconnectedColor = color;
      io.to(code).emit('player_disconnected', {
        color,
        name: room.players[color].name,
        timeoutSeconds: 60
      });

      // Clear any previous timer
      if (room.disconnectTimer) {
        clearTimeout(room.disconnectTimer);
      }

      room.disconnectTimer = setTimeout(() => {
        // If still disconnected after 60 seconds, opponent wins by forfeit
        if (!room.ended && !room.players[color].connected) {
          const opponentColor = color === 'white' ? 'black' : 'white';
          const opponentName = room.players[opponentColor].name;
          const resultText = `${opponentName} (${opponentColor.toUpperCase()}) won by forfeit (opponent disconnected)`;

          room.ended = true;
          room.endedAt = new Date().toISOString();
          room.result = resultText;

          try {
            db.saveGame({
              room_code: room.code,
              white_name: room.players.white.name,
              black_name: room.players.black.name,
              result: resultText,
              pgn: room.chess.pgn(),
              white_reveals_used: room.players.white.revealsUsed,
              black_reveals_used: room.players.black.revealsUsed,
              started_at: room.startedAt,
              ended_at: room.endedAt
            });
          } catch (e) {
            console.error('Failed to save forfeit game:', e);
          }

          io.to(code).emit('game_over', {
            result: resultText,
            winner: opponentColor,
            fen: room.chess.fen(),
            pgn: room.chess.pgn(),
            forfeit: true,
            whiteRevealsUsed: room.players.white.revealsUsed,
            blackRevealsUsed: room.players.black.revealsUsed
          });
        }
      }, 60000);
    }
  });
});

/**
 * Handle seamless player reconnection within the 60-second window
 */
function handleReconnection(socket, room, color, name) {
  if (room.disconnectTimer) {
    clearTimeout(room.disconnectTimer);
    room.disconnectTimer = null;
  }
  room.disconnectedColor = null;

  room.players[color].socketId = socket.id;
  room.players[color].connected = true;

  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.data.color = color;
  socket.data.name = name;

  // Send state to reconnecting player
  socket.emit('reconnect_success', {
    roomCode: room.code,
    color,
    whiteName: room.players.white.name,
    blackName: room.players.black.name,
    revealCount: room.revealCount,
    whiteRevealsLeft: room.players.white.revealsLeft,
    blackRevealsLeft: room.players.black.revealsLeft,
    turn: room.chess.turn(),
    isCheck: room.chess.inCheck(),
    fen: room.chess.fen(),
    activeReveal: room.activeReveal,
    moveHistory: room.moveHistory
  });

  // Notify opponent
  socket.to(room.code).emit('player_reconnected', {
    color,
    name
  });
}

// Start Server on 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
  const lanAddrs = getLanAddresses();

  console.log('\n' + '='.repeat(62));
  console.log('       ♞  B L I N D   C H E S S   S E R V E R  ♞');
  console.log('='.repeat(62));
  console.log(`  Local Access:      http://localhost:${PORT}`);
  console.log(`  Listening on:      0.0.0.0:${PORT}`);
  console.log('-'.repeat(62));
  console.log('  LAN URLs (Share with Player 2 on the same Hotspot / Wi-Fi):');

  if (lanAddrs.length === 0) {
    console.log('  [!] No active LAN interfaces detected.');
    console.log('      Turn on Windows Mobile Hotspot or connect to Wi-Fi.');
  } else {
    for (const addr of lanAddrs) {
      const tag = addr.isHotspot ? ' <--- [HOTSPOT DETECTED]' : '';
      console.log(`    * ${addr.url.padEnd(30)} (${addr.interfaceName})${tag}`);
    }
  }

  console.log('='.repeat(62));
  console.log('  Ready for matches! Press Ctrl+C to stop.\n');
});
