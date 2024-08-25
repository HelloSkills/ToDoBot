// Соединяем бота
require('dotenv').config();
const { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } = require('grammy');
const { session } = require("grammy");

const cron = require('node-cron');
const axios = require('axios');

// Подключение БД
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite'); // Импортируем sqlite после sqlite3

// Создаем и настраиваем бота
const bot = new Bot(process.env.BOT_API_KEY);


const { hydrate } = require('@grammyjs/hydrate'); // Подключаем hydrate

bot.use(hydrate()); // Применяем hydrate middleware
bot.use(session({ initial: () => ({ creatingTask: false }) })); // Подключаем сессии

// Logs

const fs = require('fs');
const path = require('path');

const Logs = path.join(__dirname, 'Logs');

// Запуск бота

bot.start();

// Подключаем базу данных SQLite
async function setupDatabase() {
	const db = await sqlite.open({
		filename: './todolist.db',
		driver: sqlite3.Database,
	});

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


const dbPromise = setupDatabase();


// Start Bot

bot.api.setMyCommands([
	{
		command: 'start',
		description: 'Список дел',
	}
])

// Command Start

bot.command('start', async (ctx) => {
	await ctx.react("❤")

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} запустил бота командой start`);
	await ctx.reply(`*Нажмите кнопку*`, {
		parse_mode: 'MarkdownV2',
		reply_markup: menuKeyboard,
	});
});

// Menu Bot
const menuKeyboard = new InlineKeyboard()
	.text('Открыть список', 'todolist').row()
	.text('Создать запись', 'create')
	.text('Изменить запись', 'update').row()
	.text('Удалить запись', 'delete')
	.text('Изменить приоритет', 'priority').row()


// Callback todolist
bot.callbackQuery('todolist', async (ctx) => {
	const db = await dbPromise;
	const tasks = await db.all('SELECT * FROM todos WHERE user_id = ?', [ctx.from.id]);

	let message = 'Ваши задачи:\n';
	if (tasks.length === 0) {
		message += 'Ваш список пуст.';
	} else {
		tasks.forEach((task, index) => {
			message += `${index + 1}. ${task.task} (Приоритет: ${task.priority})\n`;
		});
	}

	await ctx.reply(message);
	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} запросил список записей`);
});


// Callback create
bot.callbackQuery('create', async (ctx) => {
	// Устанавливаем состояние создания задачи
	ctx.session.creatingTask = true;
	await ctx.reply("Напишите в чат вашу новую заметку");

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} хочет создать новую запись.`);
});

// Обработчик сообщений для добавления задачи
bot.on('message:text', async (ctx) => {
	// Проверяем, что мы находимся в состоянии создания задачи
	if (ctx.session.creatingTask) {
		const db = await dbPromise;
		const taskText = ctx.message.text;

		// Сохраняем задачу в базу данных
		await db.run('INSERT INTO todos (user_id, task) VALUES (?, ?)', [ctx.from.id, taskText]);

		await ctx.reply('Запись добавлена в список дел.');
		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} добавил новую запись: ${taskText}`);

		// Сбрасываем состояние создания задачи
		ctx.session.creatingTask = false;
	}
});


// Callback update
bot.callbackQuery('update', async (ctx) => {
	const updatedKeyboard = new InlineKeyboard()
		.text('Открыть список', 'todolist').row()
		.text('Создать запись', 'create')
		.text('Изменить запись', 'update').row()
		.text('Удалить запись', 'delete')
		.text('Изменить приоритет', 'priority').row()

	await ctx.editMessageReplyMarkup({
		reply_markup: updatedKeyboard,
	});

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} хочет обновить свою запись`);
})


// Callback delete
bot.callbackQuery('delete', async (ctx) => {
	const updatedKeyboard = new InlineKeyboard()
		.text('Открыть список', 'todolist').row()
		.text('Создать запись', 'create')
		.text('Изменить запись', 'update').row()
		.text('Удалить запись', 'delete')
		.text('Изменить приоритет', 'priority').row()

	await ctx.editMessageReplyMarkup({
		reply_markup: updatedKeyboard,
	});

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} хочет удалить свою запись`);
})


// Callback priority
bot.callbackQuery('priority', async (ctx) => {
	const updatedKeyboard = new InlineKeyboard()
		.text('Открыть список', 'todolist').row()
		.text('Создать запись', 'create')
		.text('Изменить запись', 'update').row()
		.text('Удалить запись', 'delete')
		.text('Изменить приоритет', 'priority').row()

	await ctx.editMessageReplyMarkup({
		reply_markup: updatedKeyboard,
	});

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} хочет изменить приоритетность в списке`);
})














// Обработчик ошибок

bot.catch((err) => {
	const ctx = err.ctx;
	console.log(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;

	if (e instanceof GrammyError) {
		console.error("Error in request:", e.description)
	} else if (e instanceof HttpError) {
		console.error("Could not contact Telegram", e);
	} else {
		console.error("Unknow error", e);
	}
});
