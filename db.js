import { open } from 'sqlite'; // Импортируем sqlite после sqlite3
import sqlite3 from 'sqlite3'; // Подключение БД

// Подключаем базу данных SQLite
async function setupDatabase() {
	const db = await open({
		filename: './todolist.db',
		driver: sqlite3.Database,
	});

	// Нужен BIGINT в user_id

	await db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            task TEXT,
            priority INTEGER DEFAULT 1
        )
    `);

	return db;
}

export default setupDatabase;