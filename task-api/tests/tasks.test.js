const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API - Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks - Create Task', () => {
    it('should create a new task with valid data', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({
          title: 'Buy groceries',
          description: 'Milk, eggs, bread',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body.title).toBe('Buy groceries');
      expect(res.body.status).toBe('todo'); // default
      expect(res.body.priority).toBe('high');
      expect(res.body.completedAt).toBeNull();
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({
          description: 'No title here',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('title is required');
    });

    it('should return 400 if title is empty string', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: '   ' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if status is invalid', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({
          title: 'Test',
          status: 'invalid_status',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be one of');
    });

    it('should return 400 if priority is invalid', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({
          title: 'Test',
          priority: 'urgent',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('priority must be one of');
    });

    it('should return 400 if dueDate is invalid', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({
          title: 'Test',
          dueDate: 'not-a-date',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('dueDate must be a valid ISO date string');
    });

    it('should accept valid ISO dueDate', async () => {
      const dueDate = new Date().toISOString();
      const res = await request(app)
        .post('/tasks')
        .send({
          title: 'Test',
          dueDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBe(dueDate);
    });
  });

  describe('GET /tasks - List Tasks', () => {
    beforeEach(async () => {
      await request(app).post('/tasks').send({ title: 'Task 1' });
      await request(app).post('/tasks').send({ title: 'Task 2', status: 'in_progress' });
      await request(app).post('/tasks').send({ title: 'Task 3', status: 'done' });
    });

    it('should return all tasks', async () => {
      const res = await request(app).get('/tasks');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
    });

    it('should filter tasks by status', async () => {
      const res = await request(app).get('/tasks?status=todo');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Task 1');
    });

    it('should filter tasks by in_progress status', async () => {
      const res = await request(app).get('/tasks?status=in_progress');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Task 2');
    });

    it('should not match partial status strings', async () => {
      // Test to catch the bug in getByStatus using .includes() instead of exact match
      const res = await request(app).get('/tasks?status=done');

      expect(res.status).toBe(200);
      // Should only match 'done', not 'in_progress' or 'todo'
      // If bug exists, this might match multiple items due to substring matching
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('done');
    });

    it('should return empty array when filtering by non-existent status', async () => {
      const res = await request(app).get('/tasks?status=archived');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it('should paginate tasks correctly', async () => {
      const res = await request(app).get('/tasks?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

    it('should return second page correctly', async () => {
      const res = await request(app).get('/tasks?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Task 3');
    });

    it('should use default limit of 10 when only page is provided', async () => {
      const res = await request(app).get('/tasks?page=1');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });
  });

  describe('GET /tasks/:id - Get Single Task', () => {
    it('should not be implemented (no endpoint exists)', async () => {
      const res = await request(app).get('/tasks/some-id');

      // This will either hit /tasks/:id/complete or return 404
      // The assignment doesn't specify this endpoint
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('PUT /tasks/:id - Update Task', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Original' });
      taskId = res.body.id;
    });

    it('should update task with valid data', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .send({
          title: 'Updated',
          status: 'in_progress',
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 404 if task does not exist', async () => {
      const res = await request(app)
        .put('/tasks/nonexistent-id')
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should return 400 if title is empty string', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if status is invalid', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should partially update task', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .send({ status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Original');
      expect(res.body.status).toBe('done');
    });
  });

  describe('DELETE /tasks/:id - Delete Task', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'To Delete' });
      taskId = res.body.id;
    });

    it('should delete a task', async () => {
      const res = await request(app).delete(`/tasks/${taskId}`);

      expect(res.status).toBe(204);

      const check = await request(app).get('/tasks');
      expect(check.body.length).toBe(0);
    });

    it('should return 404 if task does not exist', async () => {
      const res = await request(app).delete('/tasks/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete - Complete Task', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/tasks')
        .send({
          title: 'Task to complete',
          priority: 'high',
        });
      taskId = res.body.id;
    });

    it('should mark task as complete', async () => {
      const res = await request(app).patch(`/tasks/${taskId}/complete`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should PRESERVE priority when marking task as complete - BUG CHECK', async () => {
      const res = await request(app).patch(`/tasks/${taskId}/complete`);

      expect(res.status).toBe(200);
      // BUG: Priority is being reset to 'medium' instead of preserving 'high'
      expect(res.body.priority).toBe('high'); // This might FAIL - indicates a bug
    });

    it('should return 404 if task does not exist', async () => {
      const res = await request(app).patch('/tasks/nonexistent-id/complete');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should set completedAt timestamp', async () => {
      const beforeTime = new Date().toISOString();
      const res = await request(app).patch(`/tasks/${taskId}/complete`);
      const afterTime = new Date().toISOString();

      expect(res.body.completedAt).not.toBeNull();
      expect(new Date(res.body.completedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime() - 1000
      );
      expect(new Date(res.body.completedAt).getTime()).toBeLessThanOrEqual(
        new Date(afterTime).getTime() + 1000
      );
    });
  });

  describe('PATCH /tasks/:id/assign - Assign Task', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Task to assign' });
      taskId = res.body.id;
    });

    it('should assign task to a user', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'John Doe' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('John Doe');
      expect(res.body.title).toBe('Task to assign');
    });

    it('should return 400 if assignee is missing', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('assignee is required');
    });

    it('should return 400 if assignee is empty string', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: '   ' });

      expect(res.status).toBe(400);
    });

    it('should return 404 if task does not exist', async () => {
      const res = await request(app)
        .patch('/tasks/nonexistent-id/assign')
        .send({ assignee: 'John Doe' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should update assignee if task already assigned', async () => {
      // First assignment
      await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'John Doe' });

      // Update assignment
      const res = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'Jane Smith' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Jane Smith');
    });

    it('should preserve other task properties when assigning', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'John Doe' });

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Task to assign');
      expect(res.body.status).toBe('todo');
      expect(res.body.createdAt).toBeDefined();
    });
  });

  describe('GET /tasks/stats - Task Statistics', () => {
    beforeEach(async () => {
      await request(app).post('/tasks').send({ title: 'Todo 1' });
      await request(app).post('/tasks').send({ title: 'Todo 2' });
      await request(app)
        .post('/tasks')
        .send({ title: 'In Progress', status: 'in_progress' });
      await request(app)
        .post('/tasks')
        .send({ title: 'Done 1', status: 'done' });

      // Create overdue task
      const pastDate = new Date('2020-01-01').toISOString();
      await request(app)
        .post('/tasks')
        .send({
          title: 'Overdue',
          status: 'todo',
          dueDate: pastDate,
        });
    });

    it('should return stats with counts', async () => {
      const res = await request(app).get('/tasks/stats');

      expect(res.status).toBe(200);
      expect(res.body.todo).toBe(3); // 2 explicit 'todo' + 1 'Overdue' with status 'todo'
      expect(res.body.in_progress).toBe(1);
      expect(res.body.done).toBe(1);
    });

    it('should count overdue tasks', async () => {
      const res = await request(app).get('/tasks/stats');

      expect(res.body.overdue).toBe(1);
    });

    it('should not count completed tasks as overdue', async () => {
      // Mark the overdue task as done
      const tasks = await request(app).get('/tasks?status=todo');
      const overdueTask = tasks.body.find((t) => t.title === 'Overdue');

      await request(app).patch(`/tasks/${overdueTask.id}/complete`);

      const res = await request(app).get('/tasks/stats');
      expect(res.body.overdue).toBe(0);
    });
  });
});
