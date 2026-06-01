import { executeSql } from "./client";
import { seedDatabase } from "./seed";

let isInitialized = false;

export const ensureDatabase = async (): Promise<void> => {
  await executeSql(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL
    );
  `);
};

export const initializeDatabase = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  await ensureDatabase();
  await seedDatabase();
  isInitialized = true;
};
