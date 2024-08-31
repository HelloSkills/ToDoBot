import Todo from './todo.js';

const botController = {

	createTodo: async function (ctx, todoText) {
		const todo = await Todo.createTodo(ctx.from.id, todoText)
		return todo
	},

	getTodos: async function (ctx) {
		const todos = await Todo.getTodos(ctx.from.id)
		return todos
	}

}



export default botController