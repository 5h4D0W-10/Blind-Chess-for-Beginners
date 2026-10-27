const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'blind_chess.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance and reliability
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code TEXT NOT NULL,
    white_name TEXT NOT NULL,
    black_name TEXT NOT NULL,
    result TEXT NOT NULL,
    pgn TEXT NOT NULL,
    white_reveals_used INTEGER NOT NULL DEFAULT 0,
    black_reveals_used INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_games_ended_at ON games(ended_at DESC);
`);

/**
 * Save a completed game to SQLite
 * @param {Object} game
 * @returns {number} inserted row ID
 */
function saveGame({
  room_code,
  white_name,
  black_name,
  result,
  pgn,
  white_reveals_used = 0,
  black_reveals_used = 0,
  started_at,
  ended_at
}) {
  const stmt = db.prepare(`
    INSERT INTO games (
      room_code,
      white_name,
      black_name,
      result,
      pgn,
      white_reveals_used,
      black_reveals_used,
      started_at,
      ended_at
    ) VALUES (
      @room_code,
      @white_name,
      @black_name,
      @result,
      @pgn,
      @white_reveals_used,
      @black_reveals_used,
      @started_at,
      @ended_at
    )
  `);

  const info = stmt.run({
    room_code: room_code || 'UNKNOWN',
    white_name: white_name || 'White',
    black_name: black_name || 'Black',
    result: result || 'Unknown',
    pgn: pgn || '',
    white_reveals_used: Number(white_reveals_used) || 0,
    black_reveals_used: Number(black_reveals_used) || 0,
    started_at: started_at || new Date().toISOString(),
    ended_at: ended_at || new Date().toISOString()
  });

  return info.lastInsertRowid;
}

/**
 * Retrieve the last N games
 * @param {number} limit
 * @returns {Array}
 */
function getRecentGames(limit = 20) {
  const stmt = db.prepare(`
    SELECT
      id,
      room_code,
      white_name,
      black_name,
      result,
      pgn,
      white_reveals_used,
      black_reveals_used,
      started_at,
      ended_at
    FROM games
    ORDER BY id DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

/**
 * Retrieve a single game by ID
 * @param {number|string} id
 * @returns {Object|undefined}
 */
function getGameById(id) {
  const stmt = db.prepare(`
    SELECT
      id,
      room_code,
      white_name,
      black_name,
      result,
      pgn,
      white_reveals_used,
      black_reveals_used,
      started_at,
      ended_at
    FROM games
    WHERE id = ?
  `);
  return stmt.get(id);
}

module.exports = {
  db,
  saveGame,
  getRecentGames,
  getGameById
};
