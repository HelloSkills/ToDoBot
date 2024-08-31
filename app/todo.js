import setupDatabase from './db.js';

const Todo = {

	db: await setupDatabase(),

	createTodo: async function (userID, todoText) {
		await this.db.run('INSERT INTO todos (user_id, task) VALUES (?, ?)', [userID, todoText]);
	},

	getTodos: async function (userID) {
		const tasks = await this.db.all('SELECT * FROM todos WHERE user_id = ? ORDER BY priority DESC', [userID]);
		return tasks;
	}

}



export default Todo