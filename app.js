document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');

    // Estado local sincronizado con localStorage
    let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];

    // Funciones de utilidad
    const saveTasks = () => {
        localStorage.setItem('todo_tasks', JSON.stringify(tasks));
    };

    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const createDeleteIcon = () => `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
    `;

    // Lógica de Renderizado
    const renderTask = (task) => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <label class="todo-content">
                <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="todo-text">${escapeHTML(task.text)}</span>
            </label>
            <button class="btn-delete" aria-label="Eliminar tarea">
                ${createDeleteIcon()}
            </button>
        `;

        list.appendChild(li);
    };

    const renderAllTasks = () => {
        list.innerHTML = '';
        tasks.forEach(renderTask);
    };

    // Controladores de acciones
    const addTask = (text) => {
        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false
        };
        tasks.push(newTask);
        saveTasks();
        renderTask(newTask);
    };

    const toggleTask = (id, liElement) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            liElement.classList.toggle('completed');
        }
    };

    const deleteTask = (id, liElement) => {
        // Disparar animación de salida
        liElement.classList.add('deleting');
        
        // Esperar a que termine la transición CSS para eliminar del DOM y estado
        liElement.addEventListener('transitionend', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            liElement.remove();
        }, { once: true });
    };

    // Event Listeners
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addTask(text);
            input.value = '';
            input.focus();
        }
    });

    // Delegación de eventos para la lista
    list.addEventListener('click', (e) => {
        const li = e.target.closest('.todo-item');
        if (!li) return;

        const id = li.dataset.id;

        if (e.target.matches('.todo-checkbox')) {
            toggleTask(id, li);
        } else if (e.target.closest('.btn-delete')) {
            deleteTask(id, li);
        }
    });

    // Inicialización
    renderAllTasks();
});