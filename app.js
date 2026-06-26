let taskIdCounter = 1;

window.onload = function () {
  loadTasks();
  document.getElementById('task-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') addTask();
  });
};

function addTask() {
  const input = document.getElementById('task-input');
  const priority = document.getElementById('task-priority').value;
  const category = document.getElementById('task-category').value;
  const text = input.value.trim();

  if (text === '') {
    input.style.borderColor = '#D4537E';
    setTimeout(() => input.style.borderColor = '#378ADD55', 1000);
    return;
  }

  const task = {
    id: 'task-' + taskIdCounter++,
    text: text,
    priority: priority,
    category: category,
    column: 'todo'
  };

  createTaskCard(task, 'todo');
  saveTasks();
  input.value = '';
  input.focus();
  updateCounts();
}

function createTaskCard(task, columnId) {
  const emptyState = document.getElementById('empty-' + columnId);
  if (emptyState) emptyState.style.display = 'none';

  const card = document.createElement('div');
  card.classList.add('task-card');
  card.setAttribute('id', task.id);
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-priority', task.priority);
  card.setAttribute('data-category', task.category);

  const priorityLabels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  const categoryLabels = { general: 'General', frontend: 'Frontend', planning: 'Planning', testing: 'Testing' };

  let moveBtnsHTML = '';
  if (columnId === 'todo') {
    moveBtnsHTML = `<button class="move-btn" onclick="moveTask('${task.id}', 'inprogress')">▶ Start</button>`;
  } else if (columnId === 'inprogress') {
    moveBtnsHTML = `
      <button class="move-btn" onclick="moveTask('${task.id}', 'todo')">◀ Back</button>
      <button class="move-btn" onclick="moveTask('${task.id}', 'done')">✔ Done</button>
    `;
  } else if (columnId === 'done') {
    moveBtnsHTML = `<button class="move-btn" onclick="moveTask('${task.id}', 'inprogress')">↩ Redo</button>`;
  }

  card.innerHTML = `
    <div class="card-top">
      <span class="task-text ${columnId === 'done' ? 'done-text' : ''}">${task.text}</span>
      <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Delete task">✕</button>
    </div>
    <div class="card-bottom">
      <span class="priority-badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
      <span class="category-badge">${categoryLabels[task.category]}</span>
      <div class="move-btns">${moveBtnsHTML}</div>
    </div>
  `;

  card.addEventListener('dragstart', dragStart);
  card.addEventListener('dragend', dragEnd);

  document.getElementById(columnId).appendChild(card);
  updateCounts();
}

function deleteTask(taskId) {
  const card = document.getElementById(taskId);
  if (!card) return;
  card.style.transform = 'scale(0.8)';
  card.style.opacity = '0';
  card.style.transition = 'all 0.2s ease';
  setTimeout(() => {
    const column = card.parentElement;
    card.remove();
    checkEmptyState(column.id);
    saveTasks();
    updateCounts();
  }, 200);
}

function moveTask(taskId, targetColumnId) {
  const card = document.getElementById(taskId);
  if (!card) return;
  const sourceColumn = card.parentElement;
  const text = card.querySelector('.task-text').textContent;
  const priority = card.getAttribute('data-priority');
  const category = card.getAttribute('data-category');
  card.remove();
  checkEmptyState(sourceColumn.id);
  createTaskCard({ id: taskId, text, priority, category, column: targetColumnId }, targetColumnId);
  saveTasks();
  updateCounts();
}

let draggedCard = null;

function dragStart(e) {
  draggedCard = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.id);
}

function dragEnd(e) {
  this.classList.remove('dragging');
  draggedCard = null;
  document.querySelectorAll('.cards-container').forEach(c => c.classList.remove('drag-over'));
}

function allowDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function drop(e) {
  e.preventDefault();
  const targetContainer = e.currentTarget;
  targetContainer.classList.remove('drag-over');
  const taskId = e.dataTransfer.getData('text/plain');
  const card = document.getElementById(taskId);
  if (card && targetContainer !== card.parentElement) {
    const targetColumnId = targetContainer.id;
    const text = card.querySelector('.task-text').textContent;
    const priority = card.getAttribute('data-priority');
    const category = card.getAttribute('data-category');
    const sourceColumn = card.parentElement;
    card.remove();
    checkEmptyState(sourceColumn.id);
    createTaskCard({ id: taskId, text, priority, category, column: targetColumnId }, targetColumnId);
    saveTasks();
    updateCounts();
  }
}

function checkEmptyState(columnId) {
  const container = document.getElementById(columnId);
  const emptyState = document.getElementById('empty-' + columnId);
  if (!emptyState) return;
  const cards = container.querySelectorAll('.task-card');
  emptyState.style.display = cards.length === 0 ? 'block' : 'none';
}

function updateCounts() {
  const columns = ['todo', 'inprogress', 'done'];
  const headerIds = ['count-todo', 'count-inprogress', 'count-done'];
  const badgeIds = ['badge-todo', 'badge-inprogress', 'badge-done'];
  columns.forEach((col, i) => {
    const count = document.getElementById(col).querySelectorAll('.task-card').length;
    document.getElementById(headerIds[i]).textContent = count;
    document.getElementById(badgeIds[i]).textContent = count;
  });
}

function saveTasks() {
  const tasks = [];
  ['todo', 'inprogress', 'done'].forEach(col => {
    document.getElementById(col).querySelectorAll('.task-card').forEach(card => {
      tasks.push({
        id: card.id,
        text: card.querySelector('.task-text').textContent,
        priority: card.getAttribute('data-priority'),
        category: card.getAttribute('data-category'),
        column: col
      });
    });
  });
  localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  localStorage.setItem('kanban-counter', taskIdCounter);
}

function loadTasks() {
  const saved = localStorage.getItem('kanban-tasks');
  const savedCounter = localStorage.getItem('kanban-counter');
  if (savedCounter) taskIdCounter = parseInt(savedCounter);
  if (saved) JSON.parse(saved).forEach(task => createTaskCard(task, task.column));
  updateCounts();
}
