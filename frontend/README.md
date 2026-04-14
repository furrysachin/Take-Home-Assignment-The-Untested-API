# Task Manager UI

A simple, practical React frontend for the Task Manager API.

## Setup

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000` and connect to the API at `http://localhost:3000/tasks`.

## Features

- **Task Form**: Add new tasks with title, description, and priority
- **Task List**: View all tasks with status and priority indicators
- **Actions**:
  - Mark tasks as complete
  - Assign tasks to team members
  - Delete tasks
- **Stats**: Quick overview of total, done, and in-progress tasks
- **Error Handling**: Simple error messages for failed operations
- **Responsive Design**: Works on desktop and mobile

## Code Structure

- `App.js` - Main component with all logic and UI
- `App.css` - Minimal, practical styling
- `index.js` - React entry point
- `index.css` - Global styles

## Design Principles

- Minimal, clean UI (like internal developer tools)
- No unnecessary animations or complex layouts
- Simple state management using React hooks
- Straightforward fetch API calls
- Practical color scheme and spacing
