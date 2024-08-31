import Todo from './todo.js';

const botController = {

	createTodo: async function (ctx, todoText) {
		const todo = await Todo.createTodo(ctx.from.id, todoText)
		return todo
	},

	updateTodoByID: async function (todoID, todoText) {
		const todo = await Todo.updateTodoByID(todoID, todoText)
		return todo
	},

	deleteTodoByID: async function (todoID) {
		const todo = await Todo.deleteTodoByID(todoID)
		return todo
	},


	getTodoByID: async function (todoID) {
		const todo = await Todo.getTodoByID(todoID)
		return todo
	},

	getTodos: async function (ctx) {
		const todos = await Todo.getTodos(ctx.from.id)
		return todos
	}

}



export default botController