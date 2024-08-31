import setupDatabase from './db.js';

const Todo = {

	db: await setupDatabase(),

	createTodo: async function (userID, todoText) {
		await this.db.run('INSERT INTO todos (user_id, task) VALUES (?, ?)', [userID, todoText]);
	},

	updateTodoByID: async function (todoID, todoText) {
		const task = await this.db.run('UPDATE todos SET task = ? WHERE id = ?', [todoID, todoText]);
		return task;
	},

	getTodoByID: async function (todoID) {
		const task = await this.db.get('SELECT * FROM todos WHERE id = ?', [todoID]);
		return task;
	},

	getTodos: async function (userID) {
		const tasks = await this.db.all('SELECT * FROM todos WHERE user_id = ? ORDER BY priority DESC', [userID]);
		return tasks;
	}

}



export default Todo