# DevTasker JS

<div align="center">

**A modern local-first productivity workspace built with HTML, CSS, and JavaScript.**

DevTasker JS helps you manage tasks, projects, notes, goals, focus sessions, reminders, and productivity analytics directly in the browser.

</div>

---

## Overview

DevTasker JS is a clean and responsive productivity dashboard made with vanilla JavaScript. It is designed for users who want a simple but powerful workspace without needing an account, backend, or database.

The app works fully in the browser and stores data locally using `localStorage`, making it lightweight, fast, and easy to deploy anywhere.

---

## Features

### Task Management

- Create, edit, delete, and complete tasks
- Add priority levels
- Set due dates
- Assign tasks to projects
- Track task status
- Manage overdue and upcoming tasks
- Add subtasks and checklists
- Support for recurring tasks

### Project Workspace

- Create and manage projects
- Organize tasks by project
- Track project progress
- View project-wise productivity

### Kanban Board

- Clean board layout
- Task status columns
- Drag and drop task movement
- Easy workflow tracking

### Calendar View

- Monthly calendar layout
- View tasks by due date
- Highlight scheduled work
- Track upcoming deadlines

### Focus Mode

- Built-in Pomodoro-style focus timer
- Start, pause, and reset focus sessions
- Track focused minutes
- Improve deep work and daily productivity

### Notes

- Create quick notes
- Pin important notes
- Use color labels
- Keep ideas and reminders in one place

### Goals

- Add daily goals
- Mark goals as complete
- Track daily progress
- Stay consistent with personal targets

### Analytics

- Task completion stats
- Weekly productivity overview
- Focus minutes tracking
- Priority distribution
- Project progress analytics
- Completed vs pending task insights

### Command Palette

- Quick search and actions
- Open with `Ctrl + K`
- Search tasks, projects, notes, and goals faster

### Browser Reminders

- Browser notification support
- Reminder permission handling
- Due task alerts
- Overdue task highlighting

### Data Management

- Local-first storage
- Export workspace data as JSON
- Import saved backup data
- Clear completed tasks
- Reset workspace when needed

---

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | App structure |
| CSS3 | Styling and responsive layout |
| JavaScript | App logic and interactions |
| LocalStorage | Local data persistence |
| Browser Notifications | Task reminder support |

---

## Folder Structure

```text
devtasker-js-v3/
├── index.html
├── package.json
└── assets/
    ├── css/
    │   └── styles.css
    └── js/
        └── app.js
```

---

## How to Run Locally

DevTasker JS does not require a backend or database.

### Option 1: Open directly

Open this file in your browser:

```text
index.html
```

### Option 2: Use a local server

If you have Node.js installed, you can run:

```bash
npx serve .
```

Then open the local server URL in your browser.

---

## Usage Guide

### Create a task

Use the task form to add a new task with title, priority, due date, project, and status.

### Manage workflow

Move tasks between board columns to update their status and track progress.

### Add projects

Create projects to organize related tasks and monitor project completion.

### Use focus mode

Start the focus timer when working on a task or project. Focus minutes will be tracked in analytics.

### Add notes

Use notes to save quick ideas, reminders, or important information.

### Track goals

Add daily goals and mark them as complete once finished.

### View analytics

Use the analytics section to understand your productivity, task completion, focus time, and project progress.

### Backup your data

Export your workspace as a JSON file and import it later when needed.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Open command palette |
| `N` | Create new task |
| `P` | Create new project |
| `/` | Focus search |
| `Esc` | Close modal or command palette |

---

## Data Storage

DevTasker JS stores all workspace data inside the browser using `localStorage`.

This means:

- No account is required
- No server is needed
- Data stays on the same browser
- Clearing browser data may remove saved tasks
- Export backup is recommended before resetting browser storage

---

## Backup and Restore

The app includes JSON-based backup and restore.

You can:

- Export all workspace data
- Import previous backup data
- Clear completed tasks
- Reset the full workspace

This makes the app safer to use while keeping it simple and local-first.

---

## Deployment

Since DevTasker JS is a static frontend project, it can be deployed on any static hosting platform.

Good options include:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Firebase Hosting

No build step is required.

---

## Project Highlights

- Built with pure JavaScript
- No framework required
- No backend required
- No database required
- Fully responsive UI
- Local-first productivity system
- Clean and beginner-friendly structure
- Easy to deploy and customize

---

## Future Improvements

Some possible future upgrades:

- User authentication
- Cloud sync
- Team workspaces
- Task sharing
- More chart types
- Custom themes
- Progressive Web App support
- Offline installable version
- Task attachments
- More reminder options

---

## Author

**Yadhuvanshi**

JavaScript Developer building clean, useful, and practical web projects.

GitHub: [@yaduvanshi742](https://github.com/yaduvanshi742)

---

## Final Note

DevTasker JS is built to be simple, fast, and useful. It keeps productivity features in one clean workspace while staying lightweight and easy to understand for developers.
