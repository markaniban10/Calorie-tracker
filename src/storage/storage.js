// STORAGE LAYER: SQLite, fully offline.
// Screens only call these async functions, never the database directly.
//
// Install: npx expo install expo-sqlite

import * as SQLite from 'expo-sqlite';
import { SEED_FOODS, SEED_VERSION } from '../data/foods';

let db = null;

const toFood = (r) => ({
  id: r.id,
  name: r.name,
  serving: r.serving,
  grams: r.grams, // weight of one serving in grams, or null
  kcal: r.kcal, // kcal per serving
  isCustom: !!r.is_custom,
});

export async function initStorage() {
  if (db) return;
  db = await SQLite.openDatabaseAsync('calorie-tracker.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      serving TEXT NOT NULL,
      kcal INTEGER NOT NULL,
      grams REAL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      last_used INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      kcal INTEGER NOT NULL,
      food_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);

    CREATE TABLE IF NOT EXISTS weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      kg REAL NOT NULL
    );
  `);

  // Migration: installs made before the grams column existed.
  const cols = await db.getAllAsync('PRAGMA table_info(foods)');
  if (!cols.some((c) => c.name === 'grams')) {
    await db.execAsync('ALTER TABLE foods ADD COLUMN grams REAL');
  }

  await seedFoods();
}

// Loads the bundled foods. Re-runs only when SEED_VERSION increases:
// existing bundled foods are updated, missing ones are inserted,
// and your own custom foods are never touched.
async function seedFoods() {
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', ['seed_version']);
  const count = await db.getFirstAsync('SELECT COUNT(*) AS n FROM foods WHERE is_custom = 0');
  if (row && Number(row.value) >= SEED_VERSION && count.n > 0) return;

  await db.withTransactionAsync(async () => {
    for (const [name, serving, grams, kcal] of SEED_FOODS) {
      await db.runAsync(
        'UPDATE foods SET grams = ?, kcal = ? WHERE name = ? AND serving = ? AND is_custom = 0',
        [grams, kcal, name, serving]
      );
      await db.runAsync(
        `INSERT INTO foods (name, serving, grams, kcal, is_custom)
         SELECT ?, ?, ?, ?, 0
         WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = ? AND serving = ? AND is_custom = 0)`,
        [name, serving, grams, kcal, name, serving]
      );
    }
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'seed_version',
      String(SEED_VERSION),
    ]);
  });
}

// ---------- Profile ----------

export async function getProfile() {
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', ['profile']);
  return row ? JSON.parse(row.value) : null;
}

export async function saveProfile(p) {
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    'profile',
    JSON.stringify(p),
  ]);
  return p;
}

// ---------- Foods ----------

// Escape % _ \ so typed characters are matched literally in LIKE.
const esc = (s) => s.replace(/[\\%_]/g, (c) => '\\' + c);

// A word in the name must START with the typed text:
// "ado" finds "Adobo" and "Chicken adobo", but not "Tomato".
const WORD_START =
  "(name LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\')";

// Empty query -> every food, A to Z.
// Otherwise every typed word must match the start of a word in the name.
// Names that START with what you typed are listed first.
export async function searchFoods(query, limit = 30) {
  const q = (query || '').trim().toLowerCase();
  let rows;
  if (!q) {
    rows = await db.getAllAsync('SELECT * FROM foods ORDER BY name COLLATE NOCASE LIMIT ?', [limit]);
  } else {
    const words = q.split(/\s+/).map(esc);
    const where = words.map(() => WORD_START).join(' AND ');
    const params = words.flatMap((w) => [`${w}%`, `% ${w}%`, `%(${w}%`, `%-${w}%`]);
    rows = await db.getAllAsync(
      `SELECT * FROM foods WHERE ${where}
       ORDER BY (name LIKE ? ESCAPE '\\') DESC, is_custom DESC,
                (last_used IS NULL), last_used DESC, name COLLATE NOCASE
       LIMIT ?`,
      [...params, `${esc(q)}%`, limit]
    );
  }
  return rows.map(toFood);
}

export async function getRecentFoods(limit = 5) {
  const rows = await db.getAllAsync(
    'SELECT * FROM foods WHERE last_used IS NOT NULL ORDER BY last_used DESC LIMIT ?',
    [limit]
  );
  return rows.map(toFood);
}

export async function addCustomFood({ name, serving, kcal, grams = null }) {
  const label = serving || '1 serving';
  const g = grams && grams > 0 ? grams : null;
  const k = Math.round(kcal);
  const res = await db.runAsync(
    'INSERT INTO foods (name, serving, kcal, grams, is_custom, last_used) VALUES (?, ?, ?, ?, 1, ?)',
    [name, label, k, g, Date.now()]
  );
  return { id: res.lastInsertRowId, name, serving: label, kcal: k, grams: g, isCustom: true };
}

// Only your own foods can be removed. Past log entries keep their name + kcal.
export async function deleteFood(id) {
  await db.runAsync('DELETE FROM foods WHERE id = ? AND is_custom = 1', [id]);
}

// ---------- Daily log ----------

export async function getEntries(date) {
  return db.getAllAsync('SELECT id, date, name, kcal FROM entries WHERE date = ? ORDER BY id', [date]);
}

export async function addEntry({ date, name, kcal, foodId = null }) {
  const label = name || 'Quick add';
  const res = await db.runAsync(
    'INSERT INTO entries (date, name, kcal, food_id) VALUES (?, ?, ?, ?)',
    [date, label, Math.round(kcal), foodId]
  );
  if (foodId) {
    await db.runAsync('UPDATE foods SET last_used = ? WHERE id = ?', [Date.now(), foodId]);
  }
  return { id: res.lastInsertRowId, date, name: label, kcal: Math.round(kcal) };
}

export async function deleteEntry(id) {
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

// ---------- Weight ----------

export async function getWeights() {
  return db.getAllAsync('SELECT id, date, kg FROM weights ORDER BY date DESC');
}

// One weigh-in per day: logging again the same day replaces it.
export async function addWeight({ date, kg }) {
  const rounded = Math.round(kg * 10) / 10;
  await db.runAsync('INSERT OR REPLACE INTO weights (date, kg) VALUES (?, ?)', [date, rounded]);
  return { date, kg: rounded };
}

export async function deleteWeight(id) {
  await db.runAsync('DELETE FROM weights WHERE id = ?', [id]);
}