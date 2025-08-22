import { InlineKeyboard } from 'grammy'; // Подключение библиотеки grammy

// Функция для отображения клавы со списком задач
const dynamicTaskRender = (tasks, { addStart, addBack } = {}) => {
	const taskKeyboard = new InlineKeyboard();

	tasks.forEach((task, index) => {
		taskKeyboard.text(task.task, `task_${task.id}`).row();
	});

	if (addStart) {
		taskKeyboard.text('🆕', 'create').row()
	}

	if (addBack) {
		taskKeyboard.text('↩️', 'main_menu');
	}

	// taskKeyboard.row();  // Разделяем ряд задач и кнопку добавления новой задачи

	// // taskKeyboard.row();  // Добавляем кнопку "Вернуться в меню"

	// taskKeyboard.text('⬅️', 'start_menu');

	return taskKeyboard;
}

export default dynamicTaskRender;