import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Функция для подключения к базе данных
async function setupDatabase() {
    return await open({
        filename: './todolist.db',
        driver: sqlite3.Database,
    });
}

// Функция для получения всех задач из таблицы todos
async function getTodos() {
    const db = await setupDatabase();
    try {
        const todos = await db.all('SELECT * FROM todos');
        return todos;
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        throw error;
    } finally {
        await db.close();
    }
}


export default setupDatabase;