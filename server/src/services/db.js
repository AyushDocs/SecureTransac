import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to database file
const dbPath = path.join(__dirname, '../../data/database.sqlite');

let db;

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable WAL mode for better concurrency and less locking
  await db.exec('PRAGMA journal_mode = WAL;');

  return db;
}

export async function initDb() {
  const database = await getDb();
  
  // Create connect_requests table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS connect_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('[SecureTransac] Database initialized: connect_requests table ready.');
}

export async function saveConnectRequest({ name, email, subject, message, type }) {
  const database = await getDb();
  
  const result = await database.run(
    `INSERT INTO connect_requests (name, email, subject, message, type) VALUES (?, ?, ?, ?, ?)`,
    [name, email, subject, message, type]
  );
  
  return { id: result.lastID, status: 'success' };
}

export default {
    getDb,
    initDb,
    saveConnectRequest
};
