document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');
    const prioritySelector = document.getElementById('priority-selector');
    const taskCounter = document.getElementById('task-counter');
    const filtersContainer = document.getElementById('filters-container');

    // Estado local sincronizado con localStorage
    let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];

    let currentFilter = 'todas';
    let selectedPriority = 'media';

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
        const priority = task.priority || 'media';
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        li.dataset.priority = priority;
        
        if (currentFilter !== 'todas' && currentFilter !== priority) {
            li.classList.add('hidden');
        }

        li.innerHTML = `
            <label class="todo-content">
                <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="todo-text">${escapeHTML(task.text)}</span>
                <span class="todo-badge badge-${priority}">${priority}</span>
            </label>
            <button class="btn-edit" aria-label="Editar tarea">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
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
            completed: false,
            priority: selectedPriority
        };
        tasks.push(newTask);
        saveTasks();
        renderTask(newTask);
        updateTaskCounter();
        // Notificar al pet widget
        document.dispatchEvent(new CustomEvent('pet-task-added'));
    };

    const toggleTask = (id, liElement) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            liElement.classList.toggle('completed');
            // Notificar al pet widget
            document.dispatchEvent(new CustomEvent('pet-task-toggled', {
                detail: { completed: tasks[taskIndex].completed }
            }));
        }
    };

    const deleteTask = (id, liElement) => {
        // Disparar animación de salida
        liElement.classList.add('deleting');
        
        // Esperar a que termine la animación CSS para eliminar del DOM y estado
        liElement.addEventListener('animationend', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            liElement.remove();
            updateTaskCounter();
            // Notificar al pet widget
            document.dispatchEvent(new CustomEvent('pet-task-deleted'));
        }, { once: true });

        // Fallback: si la animación no se dispara en 600ms, eliminar de todos modos
        setTimeout(() => {
            if (liElement.parentNode) {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                liElement.remove();
                updateTaskCounter();
                document.dispatchEvent(new CustomEvent('pet-task-deleted'));
            }
        }, 600);
    };

    // Event Listeners
    // Theme toggle (Button)
    const applyTheme = (theme) => {
        document.body.dataset.theme = theme; // set on body (which is :root for CSS vars)
    };
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.body.dataset.theme;
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Priority selector (inline dots)
    if (prioritySelector) {
        prioritySelector.addEventListener('click', (e) => {
            if (e.target.matches('.priority-dot')) {
                // Remove active from all dots
                prioritySelector.querySelectorAll('.priority-dot').forEach(dot => dot.classList.remove('active'));
                // Add active to clicked dot
                e.target.classList.add('active');
                // Update selected priority
                selectedPriority = e.target.dataset.value;
            }
        });
    }

    const updateTaskCounter = () => {
        taskCounter.textContent = `Tareas Totales: ${tasks.length}`;
    };
    updateTaskCounter();

    if (filtersContainer) {
        filtersContainer.addEventListener('click', (e) => {
            if (e.target.matches('.filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                const items = list.querySelectorAll('.todo-item');
                items.forEach(item => {
                    const taskPriority = item.dataset.priority;
                    if (currentFilter === 'todas' || currentFilter === taskPriority) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            }
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addTask(text);
            input.value = '';
            input.focus();
        }
    });

    const btnDeleteAll = document.getElementById('btn-delete-all');
    const deleteOverlay = document.getElementById('delete-modal-overlay');
    const deleteConfirm = document.getElementById('delete-modal-confirm');
    const deleteCancel = document.getElementById('delete-modal-cancel');

    const openDeleteModal = () => {
        return new Promise((resolve) => {
            deleteOverlay.classList.remove('hidden');

            const cleanup = () => {
                deleteOverlay.classList.add('hidden');
                deleteConfirm.removeEventListener('click', onConfirm);
                deleteCancel.removeEventListener('click', onCancel);
                deleteOverlay.removeEventListener('click', onOverlay);
            };

            const onConfirm = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            const onOverlay = (e) => {
                if (e.target === deleteOverlay) onCancel();
            };

            deleteConfirm.addEventListener('click', onConfirm);
            deleteCancel.addEventListener('click', onCancel);
            deleteOverlay.addEventListener('click', onOverlay);
        });
    };

    if (btnDeleteAll) {
        btnDeleteAll.addEventListener('click', async () => {
            if (tasks.length === 0) {
                alert("No hay tareas para eliminar.");
                return;
            }
            
            const confirmed = await openDeleteModal();
            
            if (confirmed) {
                tasks = [];
                saveTasks();
                renderAllTasks();
                updateTaskCounter();
                // Notificar al perrito que todas las tareas se eliminaron
                document.dispatchEvent(new CustomEvent('pet-task-deleted')); 
            }
        });
    }

    // ── Custom Edit Modal Logic ──
    const editOverlay = document.getElementById('edit-modal-overlay');
    const editInput = document.getElementById('edit-modal-input');
    const editConfirm = document.getElementById('edit-modal-confirm');
    const editCancel = document.getElementById('edit-modal-cancel');

    const openEditModal = (currentText) => {
        return new Promise((resolve) => {
            editInput.value = currentText;
            editOverlay.classList.remove('hidden');

            // Focus after animation
            setTimeout(() => editInput.focus(), 80);

            const cleanup = () => {
                editOverlay.classList.add('hidden');
                editConfirm.removeEventListener('click', onConfirm);
                editCancel.removeEventListener('click', onCancel);
                editInput.removeEventListener('keydown', onKey);
                editOverlay.removeEventListener('click', onOverlay);
            };

            const onConfirm = () => { cleanup(); resolve(editInput.value.trim()); };
            const onCancel = () => { cleanup(); resolve(null); };
            const onKey = (e) => {
                if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
                if (e.key === 'Escape') onCancel();
            };
            const onOverlay = (e) => {
                if (e.target === editOverlay) onCancel();
            };

            editConfirm.addEventListener('click', onConfirm);
            editCancel.addEventListener('click', onCancel);
            editInput.addEventListener('keydown', onKey);
            editOverlay.addEventListener('click', onOverlay);
        });
    };

    // Delegación de eventos para la lista
    list.addEventListener('change', (e) => {
        if (e.target.matches('.todo-checkbox')) {
            const li = e.target.closest('.todo-item');
            if (!li) return;
            const id = li.dataset.id;
            toggleTask(id, li);
        }
    });

    list.addEventListener('click', async (e) => {
        const li = e.target.closest('.todo-item');
        if (!li) return;

        const id = li.dataset.id;
        const task = tasks.find(t => t.id === id);

        if (e.target.matches('.todo-checkbox')) {
            // Ya se maneja con 'change', no hacer nada aquí
            return;
        } else if (e.target.closest('.btn-delete')) {
            deleteTask(id, li);
        } else if (e.target.closest('.btn-edit')) {
            const newText = await openEditModal(task.text);
            if (newText !== null && newText.length > 0) {
                task.text = newText;
                saveTasks();
                // Actualizar solo el nodo del texto para no disparar reacciones de la mascota
                li.querySelector('.todo-text').textContent = newText;
            }
        }
    });

    // Inicialización
    renderAllTasks();
    // Ensure counter reflects loaded tasks
    updateTaskCounter();
});