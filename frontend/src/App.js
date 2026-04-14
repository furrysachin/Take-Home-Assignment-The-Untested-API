import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3000/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formDescription, setFormDescription] = useState('');

  // Assign state
  const [assigningId, setAssigningId] = useState(null);
  const [assigneeName, setAssigneeName] = useState('');

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          priority: formPriority,
          status: 'todo',
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      setFormTitle('');
      setFormDescription('');
      setFormPriority('medium');
      setError(null);
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Mark task complete
  const handleComplete = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/${taskId}/complete`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to complete task');
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Assign task
  const handleAssignTask = async (taskId) => {
    if (!assigneeName.trim()) {
      setError('Assignee name is required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${taskId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee: assigneeName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to assign task');

      setAssigningId(null);
      setAssigneeName('');
      setError(null);
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete task
  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Update task status
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Get priority badge color
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  // Get status badge color
  const getStatusClass = (status) => {
    switch (status) {
      case 'done':
        return 'status-done';
      case 'in_progress':
        return 'status-in-progress';
      case 'todo':
        return 'status-todo';
      default:
        return 'status-todo';
    }
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>Task Manager</h1>
          <p>Simple, practical task management</p>
        </header>

        {/* Error message */}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button className="close-btn" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Stats */}
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{tasks.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Done:</span>
            <span className="stat-value">{tasks.filter(t => t.status === 'done').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">In Progress:</span>
            <span className="stat-value">{tasks.filter(t => t.status === 'in_progress').length}</span>
          </div>
        </div>

        {/* Add Task Form */}
        <section className="form-section">
          <h2>Add New Task</h2>
          <form onSubmit={handleAddTask} className="task-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Task title..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <textarea
                  placeholder="Description (optional)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="input select"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Add Task
            </button>
          </form>
        </section>

        {/* Task List */}
        <section className="task-section">
          <h2>Tasks</h2>

          {loading && <p className="loading">Loading tasks...</p>}

          {!loading && tasks.length === 0 && (
            <p className="empty-state">No tasks yet. Add one to get started.</p>
          )}

          {!loading && tasks.length > 0 && (
            <div className="task-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${task.status === 'done' ? 'task-completed' : ''}`}
                >
                  <div className="task-header">
                    <div className="task-title-section">
                      <h3 className="task-title">{task.title}</h3>
                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                    </div>
                    <div className="task-badges">
                      <span className={`badge ${getStatusClass(task.status)}`}>
                        {task.status || 'todo'}
                      </span>
                      <span className={`badge ${getPriorityClass(task.priority)}`}>
                        {task.priority || 'medium'}
                      </span>
                    </div>
                  </div>

                  {task.assignee && (
                    <div className="task-assignee">
                      <strong>Assigned to:</strong> {task.assignee}
                    </div>
                  )}

                  <div className="task-actions">
                    {/* Status buttons */}
                    <div className="status-buttons">
                      <button
                        className={`btn btn-small ${task.status === 'todo' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleUpdateStatus(task.id, 'todo')}
                      >
                        Todo
                      </button>
                      <button
                        className={`btn btn-small ${task.status === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                      >
                        In Progress
                      </button>
                      <button
                        className={`btn btn-small ${task.status === 'done' ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => handleUpdateStatus(task.id, 'done')}
                      >
                        ✓ Done
                      </button>
                    </div>

                    {assigningId === task.id ? (
                      <div className="assign-form">
                        <input
                          type="text"
                          placeholder="Assignee name..."
                          value={assigneeName}
                          onChange={(e) => setAssigneeName(e.target.value)}
                          className="input input-small"
                          autoFocus
                        />
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => handleAssignTask(task.id)}
                        >
                          Set
                        </button>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => {
                            setAssigningId(null);
                            setAssigneeName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => setAssigningId(task.id)}
                      >
                        👤 Assign
                      </button>
                    )}

                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(task.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
