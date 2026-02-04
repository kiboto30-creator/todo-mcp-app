// API Base URL
const API_URL = 'http://localhost:3000/api';

// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');

// Stats elements
const totalTodosEl = document.getElementById('totalTodos');
const activeTodosEl = document.getElementById('activeTodos');
const completedTodosEl = document.getElementById('completedTodos');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTodos();
        });
    });
}

// Load todos from API
async function loadTodos() {
    try {
        const response = await fetch(`${API_URL}/todos`);
        if (!response.ok) throw new Error('Ошибка загрузки задач');
        
        todos = await response.json();
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка загрузки задач', 'error');
    }
}

// Add new todo
async function addTodo() {
    const title = todoInput.value.trim();
    
    if (!title) {
        showNotification('⚠️ Введите название задачи', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
        });

        if (!response.ok) throw new Error('Ошибка создания задачи');

        const newTodo = await response.json();
        
        // Add to local state
        todos.unshift({
            id: newTodo.id,
            title: newTodo.title,
            completed: 0,
            created_at: new Date().toISOString()
        });

        todoInput.value = '';
        renderTodos();
        updateStats();
        showNotification('✅ Задача добавлена', 'success');
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка добавления задачи', 'error');
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.completed;

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: newCompleted }),
        });

        if (!response.ok) throw new Error('Ошибка обновления задачи');

        todo.completed = newCompleted;
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка обновления задачи', 'error');
    }
}

// Delete todo
async function deleteTodo(id) {
    if (!confirm('Удалить эту задачу?')) return;

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Ошибка удаления задачи');

        todos = todos.filter(t => t.id !== id);
        renderTodos();
        updateStats();
        showNotification('✅ Задача удалена', 'success');
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка удаления задачи', 'error');
    }
}

// Render todos
function renderTodos() {
    let filteredTodos = todos;

    // Apply filter
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    }

    // Show/hide empty state
    if (filteredTodos.length === 0) {
        emptyState.classList.add('show');
        todoList.innerHTML = '';
        return;
    } else {
        emptyState.classList.remove('show');
    }

    // Render todos
    todoList.innerHTML = filteredTodos.map(todo => {
        const date = new Date(todo.created_at);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo(${todo.id})"
                >
                <span class="todo-text">${escapeHtml(todo.title)}</span>
                <span class="todo-date">${formattedDate}</span>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">
                    🗑️
                </button>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;

    totalTodosEl.textContent = total;
    activeTodosEl.textContent = active;
    completedTodosEl.textContent = completed;
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple console notification (можно улучшить UI)
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // You can add toast notifications here
    // For now, just using browser alert for errors
    if (type === 'error') {
        // Could add a toast library later
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh every 30 seconds (optional)
setInterval(() => {
    loadTodos();
}, 30000);

// Global functions for onclick handlers
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
