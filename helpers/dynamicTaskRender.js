import { InlineKeyboard } from 'grammy'; // Подключение библиотеки grammy

// Функция для отображения клавы со списком задач
const dynamicTaskRender = (tasks) => {
	const taskKeyboard = new InlineKeyboard();

	tasks.forEach((task, index) => {
		taskKeyboard.text(task.task, `task_${task.id}`).row();
	});

	// taskKeyboard.row();  // Разделяем ряд задач и кнопку добавления новой задачи
	taskKeyboard.text('🆕', 'create');
	// // taskKeyboard.row();  // Добавляем кнопку "Вернуться в меню"
	// taskKeyboard.text('↩️', 'main_menu');

	return taskKeyboard;
}

export default dynamicTaskRender;