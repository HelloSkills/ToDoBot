// Соединяем бота
import 'dotenv/config';  // Подключения файла с приватками.env
import { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } from 'grammy'; // Подключение библиотеки grammy
import { session } from "grammy"; // Подключение session в grammy
import cron from 'node-cron'; // Подключение cron под расписание
import axios from 'axios'; // Подключение axiois под fetch
import sqlite3 from 'sqlite3'; // Подключение БД
import { open } from 'sqlite'; // Импортируем sqlite после sqlite3
import { hydrate } from '@grammyjs/hydrate'; // Подключаем hydrate на изменение в realtime

// Мои импорты от декомпоза
import dynamicTaskRender from './helpers/dynamicTaskRender.js';
import setupDatabase from './db.js';
// Logs
// const fs = require('fs');
// const path = require('path');
// const Logs = path.join(__dirname, 'Logs');

sqlite3.verbose()

const bot = new Bot(process.env.BOT_API_KEY); // API нашего бота
bot.use(hydrate()); // Применяем hydrate middleware
bot.use(session({ initial: () => ({ creatingTask: false }) })); // Подключение сессии
bot.start(); // Запуск бота



// // Подключаем базу данных SQLite
// async function setupDatabase() {
// 	const db = await sqlite.open({
// 		filename: './todolist.db',
// 		driver: sqlite3.Database,
// 	});

// 	// Нужен BIGINT в user_id

// 	await db.run(`
//         CREATE TABLE IF NOT EXISTS todos (
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             user_id INTEGER,
//             task TEXT,
//             priority INTEGER DEFAULT 1
//         )
//     `);

// 	return db;
// }


const dbPromise = setupDatabase();


// Спислк методов по задачам
const todoAPI = {
	getTodos: async function (ctx) {
		const db = await dbPromise;
		const tasks = await db.all('SELECT * FROM todos WHERE user_id = ? ORDER BY priority DESC', [ctx.from.id]);
		return tasks;
	}
}


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
	const tasks = await todoAPI.getTodos(ctx);
	let welcomeText = `Ваш список заметок пуст`
	let replyMarkup = startMenuKeyboard
	if (tasks.length > 0) {
		welcomeText = `Ваши заметки: ${tasks.length}`
		replyMarkup = dynamicTaskRender(tasks)
	}

	await ctx.reply(welcomeText, {
		parse_mode: 'MarkdownV2',
		reply_markup: replyMarkup,
	});
});

// Menu Bot
const startMenuKeyboard = new InlineKeyboard()
	.text('Создать новую запись', 'create')


// Клавиатура списка задач с кнопкой "Вернуться в меню"
const taskMenuKeyboard = new InlineKeyboard()
	.text('Открыть список', 'todolist').row()
	.text('Создать запись', 'create')
	.text('Изменить запись', 'update').row()
	.text('Удалить запись', 'delete')
	.text('Изменить приоритет', 'priority').row()
	.text('🏠 Вернуться в меню', 'main_menu');


// Клавиатура редактирования задачи
const editTaskKeyboard = new InlineKeyboard()
	.text('Изменить задачу', 'edit_task').row()
	.text('Удалить задачу', 'delete_task').row()
	.text('Изменить приоритет', 'update_priority').row()
	.text('🏠 Вернуться в меню', 'main_menu');


// Callback на todolist

// Обработчик кнопки "Открыть список"
bot.callbackQuery('todolist', async (ctx) => {
	const db = await dbPromise;
	const tasks = await db.all('SELECT * FROM todos WHERE user_id = ? ORDER BY priority DESC', [ctx.from.id]);

	if (tasks.length === 0) {
		await ctx.editMessageText('Ваш список пуст.', {
			reply_markup: { remove_keyboard: true }
		});
	} else {
		let message = 'Ваши задачи:\n';
		const taskKeyboard = new InlineKeyboard();

		tasks.forEach((task, index) => {
			taskKeyboard.text(task.task, `task_${task.id}`).row();
		});

		// taskKeyboard.row();  // Разделяем ряд задач и кнопку добавления новой задачи
		taskKeyboard.text('🆕', 'create');
		// taskKeyboard.row();  // Добавляем кнопку "Вернуться в меню"
		taskKeyboard.text('↩️', 'main_menu');

		await ctx.editMessageText(message, {
			reply_markup: taskKeyboard,
		});
	}
	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} запросил список задач`);
});

// Обработчик кнопки "Вернуться в меню"
bot.callbackQuery('main_menu', async (ctx) => {
	await ctx.editMessageText('*Нажмите кнопку*', {
		parse_mode: 'MarkdownV2',
		reply_markup: startMenuKeyboard
	});

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} вернулся в главное меню.`);
});


// Callback start menu

bot.callbackQuery('start_menu', async (ctx) => {

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} заюзал команду start_menu`);
	const tasks = await todoAPI.getTodos(ctx);
	let welcomeText = `Ваш список заметок пуст`
	let replyMarkup = startMenuKeyboard
	if (tasks.length > 0) {
		welcomeText = `Ваши заметки: ${tasks.length}`
		replyMarkup = dynamicTaskRender(tasks)
	}

	await ctx.editMessageText(welcomeText, {
		parse_mode: 'MarkdownV2',
		reply_markup: replyMarkup,
	});
});

// Callback create
bot.callbackQuery('create', async (ctx) => {
	// Устанавливаем состояние создания задачи
	ctx.session.creatingTask = true;

	const taskKeyboard = new InlineKeyboard();
	taskKeyboard.text('Отмена', 'start_menu');

	let newNotion = `Напишите Вашу новую заметку`

	await ctx.editMessageText(newNotion, {
		parse_mode: 'MarkdownV2',
		reply_markup: taskKeyboard,
	});

	console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} хочет создать новую запись.`);
});

// Обработчик сообщений для добавления задачи
bot.on('message:text', async (ctx) => {
	const db = await dbPromise;
	const taskText = ctx.message.text;
	let tasks = await todoAPI.getTodos(ctx);

	if (ctx.session.creatingTask) {
		// Сохраняем задачу в базу данных
		await db.run('INSERT INTO todos (user_id, task) VALUES (?, ?)', [ctx.from.id, taskText]);
		tasks = await todoAPI.getTodos(ctx);
		await ctx.reply('Ваша новая заметка добавлена в список.');
		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} добавил новую запись: ${taskText}`);

		let message = `Список записей: ${tasks.length}`;
		let replyMarkup = dynamicTaskRender(tasks)
		await ctx.reply(message, {
			reply_markup: replyMarkup
		});

		// Сбрасываем состояние создания задачи
		ctx.session.creatingTask = false;

	} else if (ctx.session.updatingTaskId) {
		// Обновляем задачу в базе данных
		await db.run('UPDATE todos SET task = ? WHERE id = ?', [taskText, ctx.session.updatingTaskId]);

		await ctx.reply('Задача обновлена.');
		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} обновил задачу ID: ${ctx.session.updatingTaskId} на: ${taskText}`);

		// Сбрасываем состояние обновления задачи
		ctx.session.updatingTaskId = null;
	}
});



// Callback update
bot.callbackQuery('update', async (ctx) => {
	const db = await dbPromise;
	const tasks = await db.all('SELECT * FROM todos WHERE user_id = ? ORDER BY priority DESC', [ctx.from.id]);

	if (tasks.length === 0) {
		await ctx.reply('Ваш список пуст.');
	} else {
		let message = 'Выберите задачу для изменения:\n';
		const updateKeyboard = new InlineKeyboard();
		tasks.forEach((task, index) => {
			message += `${index + 1}. ${task.task}\n`;
			updateKeyboard.text(task.task, `update_${task.id}`).row();  // Создаем кнопку для каждой задачи
		});
		await ctx.reply(message, {
			reply_markup: updateKeyboard,
		});
	}
});

// Обработчик нажатия на конкретную задачу для изменения
bot.callbackQuery(/^task_\d+$/, async (ctx) => {
	const taskId = ctx.callbackQuery.data.split('_')[1]; // Получаем ID задачи

	const db = await dbPromise;
	const task = await db.get('SELECT * FROM todos WHERE id = ?', [taskId]); // Получаем задачу из базы данных

	if (task) {
		ctx.session.updatingTaskId = taskId;
		ctx.session.creatingTask = false; // Сброс состояния создания задачи

		await ctx.reply(`Вы выбрали задачу:\n\n${task.task}`, {
			reply_markup: editTaskKeyboard
		});

		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} выбрал задачу ID: ${taskId}`);
	} else {
		await ctx.reply('Не удалось найти задачу. Пожалуйста, попробуйте снова.');
	}
});


// Обработчик нажатия на конкретную задачу для изменения
bot.callbackQuery(/^task_update_\d+$/, async (ctx) => {
	const taskId = ctx.callbackQuery.data.split('_')[3]; // Получаем ID задачи
	ctx.session.updatingTaskId = taskId;
	ctx.session.creatingTask = false; // Сброс состояния создания задачи

	await ctx.reply('Выберите действие с задачей:', {
		reply_markup: editTaskKeyboard
	});
});

// Обработчик нажатия на "Изменить задачу"
bot.callbackQuery('edit_task', async (ctx) => {
	if (ctx.session.updatingTaskId) {
		await ctx.reply('Введите новый текст для задачи:');
		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} хочет изменить текст задачи ID: ${ctx.session.updatingTaskId}`);
	}
});

// Обработчик нажатия на "Удалить задачу"
bot.callbackQuery('delete_task', async (ctx) => {
	if (ctx.session.updatingTaskId) {
		const db = await dbPromise;
		await db.run('DELETE FROM todos WHERE id = ?', [ctx.session.updatingTaskId]);

		await ctx.reply('Задача удалена.');
		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} удалил задачу ID: ${ctx.session.updatingTaskId}`);


		let message = 'Нажмите кнопку';
		await ctx.reply(message, {
			reply_markup: taskMenuKeyboard
		});
		ctx.session.updatingTaskId = null;
	}
});

// Обработчик нажатия на "Изменить приоритет"
bot.callbackQuery('update_priority', async (ctx) => {
	if (ctx.session.updatingTaskId) {
		await ctx.reply('Введите новый приоритет для задачи:');
		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} хочет изменить приоритет задачи ID: ${ctx.session.updatingTaskId}`);
	}
});

// Обработчик сообщений для изменения задачи
bot.on('message:text', async (ctx) => {
	const db = await dbPromise;
	const taskText = ctx.message.text;

	if (ctx.session.creatingTask) {
		// Сохраняем задачу в базу данных
		await db.run('INSERT INTO todos (user_id, task) VALUES (?, ?)', [ctx.from.id, taskText]);

		await ctx.reply('Запись добавлена в список дел.');
		console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} добавил новую запись: ${taskText}`);

		ctx.session.creatingTask = false;

	} else if (ctx.session.updatingTaskId) {
		if (ctx.callbackQuery.data.startsWith('update_priority')) {
			// Обновляем приоритет задачи
			const priority = parseInt(taskText, 10);
			if (isNaN(priority)) {
				await ctx.reply('Пожалуйста, введите корректный приоритет.');
				return;
			}
			await db.run('UPDATE todos SET priority = ? WHERE id = ?', [priority, ctx.session.updatingTaskId]);

			await ctx.reply('Приоритет задачи обновлен.');
		} else {
			// Обновляем текст задачи
			await db.run('UPDATE todos SET task = ? WHERE id = ?', [taskText, ctx.session.updatingTaskId]);

			await ctx.reply('Задача обновлена.');
			console.log(`Пользователь ${ctx.from.username} и ID: ${ctx.from.id} обновил задачу ID: ${ctx.session.updatingTaskId} на: ${taskText}`);
		}

		ctx.session.updatingTaskId = null;
	}
});













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
