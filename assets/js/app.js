(() => {
  "use strict";

  const STORAGE_KEY = "devtasker-js-v3-state";
  const APP_VERSION = "3.0.0";
  const STATUS_LABELS = {
    todo: "To Do",
    progress: "In Progress",
    done: "Completed"
  };
  const PRIORITY_LABELS = {
    high: "High",
    medium: "Medium",
    low: "Low"
  };
  const RECURRING_LABELS = {
    none: "No repeat",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly"
  };
  const VIEW_TITLES = {
    dashboard: "Dashboard",
    board: "Kanban Board",
    calendar: "Calendar",
    focus: "Focus Mode",
    notes: "Notes",
    goals: "Goals",
    analytics: "Analytics",
    timeline: "Activity Timeline",
    settings: "Settings"
  };

  const state = normalizeState(loadState());
  let calendarCursor = new Date();
  let draggedTaskId = null;
  let timerInterval = null;
  let timer = createTimerState("focus");

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    applyTheme();
    bindEvents();
    scheduleReminderCheck();
    renderAll();
    const initialView = window.location.hash.replace("#", "");
    if (VIEW_TITLES[initialView]) setView(initialView);
  }

  function cacheDom() {
    dom.body = document.body;
    dom.sidebar = $(".sidebar");
    dom.mobileMenuButton = $("#mobileMenuButton");
    dom.viewTitle = $("#viewTitle");
    dom.navLinks = $$('[data-view-link]');
    dom.themeToggleButton = $("#themeToggleButton");
    dom.quickTaskButton = $("#quickTaskButton");
    dom.openCommandButton = $("#openCommandButton");

    dom.dashboardStats = $("#dashboardStats");
    dom.todayTaskList = $("#todayTaskList");
    dom.recentActivityList = $("#recentActivityList");
    dom.projectProgressList = $("#projectProgressList");
    dom.focusSummary = $("#focusSummary");
    dom.newProjectDashboardButton = $("#newProjectDashboardButton");

    dom.taskSearchInput = $("#taskSearchInput");
    dom.projectFilterSelect = $("#projectFilterSelect");
    dom.priorityFilterSelect = $("#priorityFilterSelect");
    dom.newProjectButton = $("#newProjectButton");
    dom.newTaskBoardButton = $("#newTaskBoardButton");
    dom.dropzones = $$('[data-dropzone]');
    dom.todoCount = $("#todoCount");
    dom.progressCount = $("#progressCount");
    dom.doneCount = $("#doneCount");

    dom.calendarTitle = $("#calendarTitle");
    dom.calendarGrid = $("#calendarGrid");
    dom.prevMonthButton = $("#prevMonthButton");
    dom.todayMonthButton = $("#todayMonthButton");
    dom.nextMonthButton = $("#nextMonthButton");

    dom.focusModeLabel = $("#focusModeLabel");
    dom.timerDisplay = $("#timerDisplay");
    dom.focusTaskSelect = $("#focusTaskSelect");
    dom.startTimerButton = $("#startTimerButton");
    dom.pauseTimerButton = $("#pauseTimerButton");
    dom.resetTimerButton = $("#resetTimerButton");
    dom.focusSessionList = $("#focusSessionList");
    dom.totalFocusPill = $("#totalFocusPill");

    dom.noteForm = $("#noteForm");
    dom.noteTitleInput = $("#noteTitleInput");
    dom.noteBodyInput = $("#noteBodyInput");
    dom.noteColorInput = $("#noteColorInput");
    dom.notePinnedInput = $("#notePinnedInput");
    dom.noteSearchInput = $("#noteSearchInput");
    dom.notesGrid = $("#notesGrid");

    dom.goalForm = $("#goalForm");
    dom.goalTitleInput = $("#goalTitleInput");
    dom.goalTargetInput = $("#goalTargetInput");
    dom.goalsList = $("#goalsList");

    dom.analyticsStats = $("#analyticsStats");
    dom.weeklyTaskChart = $("#weeklyTaskChart");
    dom.priorityChart = $("#priorityChart");
    dom.analyticsProjectList = $("#analyticsProjectList");
    dom.focusChart = $("#focusChart");

    dom.timelineList = $("#timelineList");
    dom.clearTimelineButton = $("#clearTimelineButton");

    dom.exportDataButton = $("#exportDataButton");
    dom.importDataInput = $("#importDataInput");
    dom.clearCompletedButton = $("#clearCompletedButton");
    dom.resetWorkspaceButton = $("#resetWorkspaceButton");
    dom.focusDurationInput = $("#focusDurationInput");
    dom.shortBreakInput = $("#shortBreakInput");
    dom.longBreakInput = $("#longBreakInput");
    dom.saveSettingsButton = $("#saveSettingsButton");
    dom.enableNotificationsButton = $("#enableNotificationsButton");
    dom.settingsStatus = $("#settingsStatus");

    dom.taskModal = $("#taskModal");
    dom.taskForm = $("#taskForm");
    dom.taskIdInput = $("#taskIdInput");
    dom.taskModalTitle = $("#taskModalTitle");
    dom.taskTitleInput = $("#taskTitleInput");
    dom.taskDescriptionInput = $("#taskDescriptionInput");
    dom.taskProjectInput = $("#taskProjectInput");
    dom.taskStatusInput = $("#taskStatusInput");
    dom.taskPriorityInput = $("#taskPriorityInput");
    dom.taskDueDateInput = $("#taskDueDateInput");
    dom.taskRecurringInput = $("#taskRecurringInput");
    dom.taskSubtasksInput = $("#taskSubtasksInput");
    dom.subtaskChecklistPreview = $("#subtaskChecklistPreview");
    dom.deleteTaskButton = $("#deleteTaskButton");

    dom.projectModal = $("#projectModal");
    dom.projectForm = $("#projectForm");
    dom.projectIdInput = $("#projectIdInput");
    dom.projectNameInput = $("#projectNameInput");
    dom.projectDescriptionInput = $("#projectDescriptionInput");
    dom.projectColorInput = $("#projectColorInput");

    dom.commandPalette = $("#commandPalette");
    dom.commandInput = $("#commandInput");
    dom.commandResults = $("#commandResults");
    dom.toastStack = $("#toastStack");
  }

  function bindEvents() {
    dom.navLinks.forEach((link) => {
      link.addEventListener("click", () => setView(link.dataset.viewLink));
    });

    dom.mobileMenuButton.addEventListener("click", () => {
      dom.sidebar.classList.toggle("open");
    });

    dom.themeToggleButton.addEventListener("click", () => {
      state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      addActivity("settings", `Changed theme to ${state.settings.theme}.`);
      saveState();
      applyTheme();
      showToast("Theme updated.");
    });

    dom.quickTaskButton.addEventListener("click", () => openTaskModal());
    dom.newTaskBoardButton.addEventListener("click", () => openTaskModal());
    dom.newProjectButton.addEventListener("click", () => openProjectModal());
    dom.newProjectDashboardButton.addEventListener("click", () => openProjectModal());
    dom.openCommandButton.addEventListener("click", openCommandPalette);

    [dom.taskSearchInput, dom.projectFilterSelect, dom.priorityFilterSelect].forEach((input) => {
      input.addEventListener("input", renderKanban);
      input.addEventListener("change", renderKanban);
    });

    dom.dropzones.forEach((zone) => {
      zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        zone.classList.add("drag-over");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("drag-over");
        const targetStatus = zone.dataset.dropzone;
        if (draggedTaskId) moveTaskToStatus(draggedTaskId, targetStatus);
      });
    });

    dom.taskForm.addEventListener("submit", handleTaskSubmit);
    dom.deleteTaskButton.addEventListener("click", handleTaskDelete);
    dom.projectForm.addEventListener("submit", handleProjectSubmit);

    $$('[data-close-modal]').forEach((button) => {
      button.addEventListener("click", () => closeModal(button.dataset.closeModal));
    });

    [dom.taskModal, dom.projectModal].forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal(modal.id);
      });
    });

    dom.prevMonthButton.addEventListener("click", () => changeMonth(-1));
    dom.todayMonthButton.addEventListener("click", () => {
      calendarCursor = new Date();
      renderCalendar();
    });
    dom.nextMonthButton.addEventListener("click", () => changeMonth(1));

    $$('[data-focus-mode]').forEach((button) => {
      button.addEventListener("click", () => setFocusMode(button.dataset.focusMode));
    });
    dom.startTimerButton.addEventListener("click", startTimer);
    dom.pauseTimerButton.addEventListener("click", pauseTimer);
    dom.resetTimerButton.addEventListener("click", resetTimer);

    dom.noteForm.addEventListener("submit", handleNoteSubmit);
    dom.noteSearchInput.addEventListener("input", renderNotes);
    dom.goalForm.addEventListener("submit", handleGoalSubmit);

    dom.clearTimelineButton.addEventListener("click", () => {
      if (!confirm("Clear the activity timeline?")) return;
      state.activity = [];
      saveState();
      renderTimeline();
      showToast("Timeline cleared.");
    });

    dom.exportDataButton.addEventListener("click", exportData);
    dom.importDataInput.addEventListener("change", importData);
    dom.clearCompletedButton.addEventListener("click", clearCompletedTasks);
    dom.resetWorkspaceButton.addEventListener("click", resetWorkspace);
    dom.saveSettingsButton.addEventListener("click", saveSettingsFromInputs);
    dom.enableNotificationsButton.addEventListener("click", enableNotifications);

    dom.commandPalette.addEventListener("click", (event) => {
      if (event.target === dom.commandPalette) closeCommandPalette();
    });
    dom.commandInput.addEventListener("input", renderCommandResults);

    document.addEventListener("keydown", handleKeyboardShortcuts);
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return createSeedState();
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Failed to load saved data.", error);
      return createSeedState();
    }
  }

  function normalizeState(value) {
    const seed = createSeedState(false);
    const normalized = {
      version: value.version || APP_VERSION,
      projects: Array.isArray(value.projects) ? value.projects : seed.projects,
      tasks: Array.isArray(value.tasks) ? value.tasks : seed.tasks,
      notes: Array.isArray(value.notes) ? value.notes : seed.notes,
      goals: Array.isArray(value.goals) ? value.goals : seed.goals,
      sessions: Array.isArray(value.sessions) ? value.sessions : seed.sessions,
      activity: Array.isArray(value.activity) ? value.activity : seed.activity,
      settings: {
        ...seed.settings,
        ...(value.settings || {})
      }
    };

    normalized.projects = normalized.projects.map((project) => ({
      id: project.id || createId(),
      name: project.name || "Untitled Project",
      description: project.description || "",
      color: project.color || "blue",
      archived: Boolean(project.archived),
      createdAt: project.createdAt || new Date().toISOString()
    }));

    if (!normalized.projects.length) normalized.projects = seed.projects;

    normalized.tasks = normalized.tasks.map((task) => ({
      id: task.id || createId(),
      title: task.title || "Untitled Task",
      description: task.description || "",
      projectId: findProject(task.projectId, normalized.projects) ? task.projectId : normalized.projects[0].id,
      status: ["todo", "progress", "done"].includes(task.status) ? task.status : "todo",
      priority: ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium",
      dueDate: task.dueDate || "",
      recurring: ["none", "daily", "weekly", "monthly"].includes(task.recurring) ? task.recurring : "none",
      subtasks: normalizeSubtasks(task.subtasks),
      focusMinutes: Number(task.focusMinutes || 0),
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString(),
      completedAt: task.completedAt || ""
    }));

    normalized.notes = normalized.notes.map((note) => ({
      id: note.id || createId(),
      title: note.title || "Untitled Note",
      body: note.body || "",
      color: note.color || "blue",
      pinned: Boolean(note.pinned),
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString()
    }));

    normalized.goals = normalized.goals.map((goal) => ({
      id: goal.id || createId(),
      title: goal.title || "Untitled Goal",
      target: Math.max(1, Number(goal.target || 1)),
      current: Math.max(0, Number(goal.current || 0)),
      createdAt: goal.createdAt || new Date().toISOString()
    }));

    normalized.sessions = normalized.sessions.map((session) => ({
      id: session.id || createId(),
      taskId: session.taskId || "",
      mode: session.mode || "focus",
      minutes: Math.max(0, Number(session.minutes || 0)),
      startedAt: session.startedAt || new Date().toISOString(),
      endedAt: session.endedAt || new Date().toISOString()
    }));

    normalized.activity = normalized.activity.map((item) => ({
      id: item.id || createId(),
      type: item.type || "info",
      text: item.text || "Updated workspace.",
      createdAt: item.createdAt || new Date().toISOString()
    }));

    return normalized;
  }

  function normalizeSubtasks(subtasks) {
    if (!Array.isArray(subtasks)) return [];
    return subtasks.map((subtask) => ({
      id: subtask.id || createId(),
      title: subtask.title || "Checklist item",
      done: Boolean(subtask.done)
    }));
  }

  function createSeedState(withActivity = true) {
    const projectBuild = createId();
    const projectLearn = createId();
    const today = todayISO();
    const tomorrow = addDaysISO(today, 1);
    const nextWeek = addDaysISO(today, 7);
    const activity = withActivity ? [
      {
        id: createId(),
        type: "system",
        text: "DevTasker JS V3 workspace created.",
        createdAt: new Date().toISOString()
      }
    ] : [];

    return {
      version: APP_VERSION,
      projects: [
        {
          id: projectBuild,
          name: "Launch DevTasker",
          description: "Build and polish the productivity workspace.",
          color: "blue",
          archived: false,
          createdAt: new Date().toISOString()
        },
        {
          id: projectLearn,
          name: "JavaScript Growth",
          description: "Practice clean JavaScript, UI logic, and local storage.",
          color: "purple",
          archived: false,
          createdAt: new Date().toISOString()
        }
      ],
      tasks: [
        {
          id: createId(),
          title: "Polish responsive dashboard",
          description: "Check spacing, mobile layout, and empty states before deployment.",
          projectId: projectBuild,
          status: "progress",
          priority: "high",
          dueDate: today,
          recurring: "none",
          subtasks: [
            { id: createId(), title: "Review cards", done: true },
            { id: createId(), title: "Test mobile board", done: false },
            { id: createId(), title: "Clean backup tools", done: false }
          ],
          focusMinutes: 20,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: ""
        },
        {
          id: createId(),
          title: "Practice one JavaScript concept",
          description: "Spend one focused session on DOM, arrays, modules, or async JS.",
          projectId: projectLearn,
          status: "todo",
          priority: "medium",
          dueDate: tomorrow,
          recurring: "daily",
          subtasks: [
            { id: createId(), title: "Read notes", done: false },
            { id: createId(), title: "Build tiny example", done: false }
          ],
          focusMinutes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: ""
        },
        {
          id: createId(),
          title: "Create project README later",
          description: "Docs are intentionally not included in this deployment ZIP.",
          projectId: projectBuild,
          status: "done",
          priority: "low",
          dueDate: nextWeek,
          recurring: "none",
          subtasks: [],
          focusMinutes: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }
      ],
      notes: [
        {
          id: createId(),
          title: "V3 focus",
          body: "Focus timer, recurring tasks, subtasks, command palette, reminders, and analytics are now part of the app.",
          color: "blue",
          pinned: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      goals: [
        {
          id: createId(),
          title: "Complete 3 important tasks",
          target: 3,
          current: 1,
          createdAt: new Date().toISOString()
        }
      ],
      sessions: [
        {
          id: createId(),
          taskId: "",
          mode: "focus",
          minutes: 20,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString()
        }
      ],
      activity,
      settings: {
        theme: "light",
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        notificationsEnabled: false,
        reminderLog: {}
      }
    };
  }

  function saveState() {
    state.version = APP_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderAll() {
    renderProjectSelects();
    renderDashboard();
    renderKanban();
    renderCalendar();
    renderFocus();
    renderNotes();
    renderGoals();
    renderAnalytics();
    renderTimeline();
    syncSettingsInputs();
    renderCommandResults();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme;
  }

  function setView(view) {
    if (!VIEW_TITLES[view]) return;
    $$(".view").forEach((panel) => panel.classList.toggle("active", panel.dataset.view === view));
    $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.viewLink === view));
    dom.viewTitle.textContent = VIEW_TITLES[view];
    dom.sidebar.classList.remove("open");
    window.location.hash = view;
    renderAll();
  }

  function renderDashboard() {
    const stats = getStats();
    renderStats(dom.dashboardStats, [
      ["Open tasks", stats.openTasks],
      ["Completed", stats.completedTasks],
      ["Overdue", stats.overdueTasks],
      ["Focus minutes", stats.focusMinutes]
    ]);

    const todayTasks = state.tasks
      .filter((task) => task.dueDate === todayISO() && task.status !== "done")
      .sort(sortByPriority);
    dom.todayTaskList.innerHTML = todayTasks.length
      ? todayTasks.map(renderListTask).join("")
      : renderEmpty("No tasks due today. Create one or enjoy the clean slate.");
    bindListTaskActions(dom.todayTaskList);

    dom.recentActivityList.innerHTML = state.activity.length
      ? state.activity.slice(0, 5).map(renderActivityItem).join("")
      : renderEmpty("No activity yet.");

    dom.projectProgressList.innerHTML = state.projects.length
      ? state.projects.map(renderProjectProgress).join("")
      : renderEmpty("Create a project to organize your tasks.");
    bindProjectActions(dom.projectProgressList);

    renderBarChart(dom.focusSummary, getLastSevenDays().map((day) => {
      const minutes = state.sessions
        .filter((session) => toISODate(session.endedAt) === day.iso)
        .reduce((sum, session) => sum + session.minutes, 0);
      return { label: day.short, value: minutes };
    }), "min");
  }

  function renderStats(target, rows) {
    target.innerHTML = rows.map(([label, value]) => `
      <article class="stat-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </article>
    `).join("");
  }

  function getStats() {
    const today = todayISO();
    return {
      openTasks: state.tasks.filter((task) => task.status !== "done").length,
      completedTasks: state.tasks.filter((task) => task.status === "done").length,
      overdueTasks: state.tasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== "done").length,
      highPriority: state.tasks.filter((task) => task.priority === "high" && task.status !== "done").length,
      projects: state.projects.length,
      notes: state.notes.length,
      goals: state.goals.length,
      focusMinutes: state.sessions.reduce((sum, session) => sum + Number(session.minutes || 0), 0)
    };
  }

  function renderKanban() {
    const filters = getTaskFilters();
    const tasks = getFilteredTasks(filters);
    const grouped = {
      todo: tasks.filter((task) => task.status === "todo"),
      progress: tasks.filter((task) => task.status === "progress"),
      done: tasks.filter((task) => task.status === "done")
    };

    Object.entries(grouped).forEach(([status, items]) => {
      const zone = $(`[data-dropzone="${status}"]`);
      zone.innerHTML = items.length ? items.map(renderTaskCard).join("") : renderEmpty(`No ${STATUS_LABELS[status].toLowerCase()} tasks.`);
    });

    dom.todoCount.textContent = grouped.todo.length;
    dom.progressCount.textContent = grouped.progress.length;
    dom.doneCount.textContent = grouped.done.length;
    bindTaskCards();
  }

  function getTaskFilters() {
    return {
      query: (dom.taskSearchInput.value || "").trim().toLowerCase(),
      projectId: dom.projectFilterSelect.value || "all",
      priority: dom.priorityFilterSelect.value || "all"
    };
  }

  function getFilteredTasks(filters) {
    return state.tasks
      .filter((task) => {
        const project = findProject(task.projectId);
        const haystack = [task.title, task.description, project ? project.name : "", task.priority, task.status]
          .join(" ")
          .toLowerCase();
        const matchesQuery = !filters.query || haystack.includes(filters.query);
        const matchesProject = filters.projectId === "all" || task.projectId === filters.projectId;
        const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
        return matchesQuery && matchesProject && matchesPriority;
      })
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (b.status === "done" && a.status !== "done") return -1;
        return sortByPriority(a, b) || (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
      });
  }

  function renderTaskCard(task) {
    const project = findProject(task.projectId);
    const subtaskPercent = getSubtaskPercent(task);
    const dueTag = getDueTag(task);
    return `
      <article class="task-card" draggable="true" data-task-id="${escapeHtml(task.id)}">
        <h4>${escapeHtml(task.title)}</h4>
        ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ""}
        <div class="card-meta">
          <span class="tag ${escapeHtml(task.priority)}">${escapeHtml(PRIORITY_LABELS[task.priority])}</span>
          <span class="tag">${escapeHtml(project ? project.name : "No project")}</span>
          ${task.recurring !== "none" ? `<span class="tag">${escapeHtml(RECURRING_LABELS[task.recurring])}</span>` : ""}
          ${dueTag}
        </div>
        ${task.subtasks.length ? `
          <div class="subtask-preview">
            <div class="progress-track"><div class="progress-fill" style="width:${subtaskPercent}%"></div></div>
            <p>${getDoneSubtaskCount(task)} of ${task.subtasks.length} subtasks done</p>
          </div>
        ` : ""}
        <div class="card-meta">
          <button class="text-button" data-action="focus-task" data-task-id="${escapeHtml(task.id)}" type="button">Focus</button>
          <button class="text-button" data-action="toggle-complete" data-task-id="${escapeHtml(task.id)}" type="button">${task.status === "done" ? "Reopen" : "Complete"}</button>
        </div>
      </article>
    `;
  }

  function getDueTag(task) {
    if (!task.dueDate) return "";
    const today = todayISO();
    if (task.status !== "done" && task.dueDate < today) return `<span class="tag overdue">Overdue</span>`;
    if (task.dueDate === today) return `<span class="tag medium">Today</span>`;
    if (task.status === "done") return `<span class="tag done">Done</span>`;
    return `<span class="tag">${escapeHtml(formatDate(task.dueDate))}</span>`;
  }

  function bindTaskCards() {
    $$(".task-card").forEach((card) => {
      card.addEventListener("click", () => openTaskModal(card.dataset.taskId));
      card.addEventListener("dragstart", (event) => {
        draggedTaskId = card.dataset.taskId;
        card.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedTaskId);
      });
      card.addEventListener("dragend", () => {
        draggedTaskId = null;
        card.classList.remove("dragging");
      });
      $$('button[data-action]', card).forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const taskId = button.dataset.taskId;
          if (button.dataset.action === "toggle-complete") toggleCompleteTask(taskId);
          if (button.dataset.action === "focus-task") {
            setView("focus");
            dom.focusTaskSelect.value = taskId;
          }
        });
      });
    });
  }

  function bindListTaskActions(root) {
    $$('[data-list-task]', root).forEach((button) => {
      button.addEventListener("click", () => openTaskModal(button.dataset.listTask));
    });
  }

  function renderListTask(task) {
    const project = findProject(task.projectId);
    return `
      <button class="list-item" data-list-task="${escapeHtml(task.id)}" type="button">
        <strong>${escapeHtml(task.title)}</strong>
        <p>${escapeHtml(project ? project.name : "No project")} - ${escapeHtml(PRIORITY_LABELS[task.priority])}</p>
      </button>
    `;
  }

  function moveTaskToStatus(taskId, status) {
    const task = findTask(taskId);
    if (!task || task.status === status) return;
    if (status === "done") {
      completeTask(taskId);
      return;
    }
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status !== "done") task.completedAt = "";
    addActivity("task", `Moved task '${task.title}' to ${STATUS_LABELS[status]}.`);
    saveState();
    renderAll();
  }

  function toggleCompleteTask(taskId) {
    const task = findTask(taskId);
    if (!task) return;
    if (task.status === "done") {
      task.status = "todo";
      task.completedAt = "";
      task.updatedAt = new Date().toISOString();
      addActivity("task", `Reopened task '${task.title}'.`);
    } else {
      completeTask(taskId, false);
      return;
    }
    saveState();
    renderAll();
  }

  function completeTask(taskId, alreadyRendered = false) {
    const task = findTask(taskId);
    if (!task) return;
    task.status = "done";
    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    task.subtasks = task.subtasks.map((subtask) => ({ ...subtask, done: true }));
    addActivity("task", `Completed task '${task.title}'.`);

    if (task.recurring !== "none") {
      const nextDue = getNextDueDate(task.dueDate || todayISO(), task.recurring);
      const nextTask = {
        ...task,
        id: createId(),
        status: "todo",
        dueDate: nextDue,
        subtasks: task.subtasks.map((subtask) => ({ id: createId(), title: subtask.title, done: false })),
        focusMinutes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: ""
      };
      state.tasks.push(nextTask);
      addActivity("task", `Created next ${task.recurring} task '${nextTask.title}' for ${formatDate(nextDue)}.`);
    }

    saveState();
    if (!alreadyRendered) renderAll();
  }

  function openTaskModal(taskId = "") {
    const task = findTask(taskId);
    renderProjectSelects();
    dom.taskIdInput.value = task ? task.id : "";
    dom.taskModalTitle.textContent = task ? "Edit task" : "Create task";
    dom.taskTitleInput.value = task ? task.title : "";
    dom.taskDescriptionInput.value = task ? task.description : "";
    dom.taskProjectInput.value = task ? task.projectId : state.projects[0].id;
    dom.taskStatusInput.value = task ? task.status : "todo";
    dom.taskPriorityInput.value = task ? task.priority : "medium";
    dom.taskDueDateInput.value = task ? task.dueDate : todayISO();
    dom.taskRecurringInput.value = task ? task.recurring : "none";
    dom.taskSubtasksInput.value = task ? task.subtasks.map((subtask) => subtask.title).join("\n") : "";
    renderSubtaskChecklist(task);
    dom.deleteTaskButton.classList.toggle("hidden", !task);
    openModal("taskModal");
    setTimeout(() => dom.taskTitleInput.focus(), 0);
  }

  function renderSubtaskChecklist(task) {
    if (!dom.subtaskChecklistPreview) return;
    if (!task || !task.subtasks.length) {
      dom.subtaskChecklistPreview.innerHTML = "";
      return;
    }
    dom.subtaskChecklistPreview.innerHTML = task.subtasks.map((subtask) => `
      <label class="checklist-row">
        <input type="checkbox" data-toggle-subtask="${escapeHtml(subtask.id)}" ${subtask.done ? "checked" : ""} />
        <span>${escapeHtml(subtask.title)}</span>
      </label>
    `).join("");
    $$('[data-toggle-subtask]', dom.subtaskChecklistPreview).forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const currentTask = findTask(task.id);
        if (!currentTask) return;
        const currentSubtask = currentTask.subtasks.find((item) => item.id === checkbox.dataset.toggleSubtask);
        if (!currentSubtask) return;
        currentSubtask.done = checkbox.checked;
        currentTask.updatedAt = new Date().toISOString();
        saveState();
        renderKanban();
      });
    });
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    const existingTask = findTask(dom.taskIdInput.value);
    const title = dom.taskTitleInput.value.trim();
    if (!title) return;
    const subtasks = parseSubtasks(dom.taskSubtasksInput.value, existingTask);
    const payload = {
      title,
      description: dom.taskDescriptionInput.value.trim(),
      projectId: dom.taskProjectInput.value,
      status: dom.taskStatusInput.value,
      priority: dom.taskPriorityInput.value,
      dueDate: dom.taskDueDateInput.value,
      recurring: dom.taskRecurringInput.value,
      subtasks,
      updatedAt: new Date().toISOString()
    };

    if (existingTask) {
      Object.assign(existingTask, payload);
      existingTask.completedAt = payload.status === "done" ? existingTask.completedAt || new Date().toISOString() : "";
      addActivity("task", `Updated task '${existingTask.title}'.`);
      showToast("Task updated.");
    } else {
      const task = {
        id: createId(),
        ...payload,
        focusMinutes: 0,
        createdAt: new Date().toISOString(),
        completedAt: payload.status === "done" ? new Date().toISOString() : ""
      };
      state.tasks.push(task);
      addActivity("task", `Created task '${task.title}'.`);
      showToast("Task created.");
    }

    saveState();
    closeModal("taskModal");
    renderAll();
  }

  function handleTaskDelete() {
    const task = findTask(dom.taskIdInput.value);
    if (!task) return;
    if (!confirm(`Delete task '${task.title}'?`)) return;
    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    addActivity("task", `Deleted task '${task.title}'.`);
    saveState();
    closeModal("taskModal");
    renderAll();
    showToast("Task deleted.");
  }

  function parseSubtasks(value, existingTask) {
    const previous = existingTask ? existingTask.subtasks : [];
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title) => {
        const old = previous.find((subtask) => subtask.title.toLowerCase() === title.toLowerCase());
        return { id: old ? old.id : createId(), title, done: old ? old.done : false };
      });
  }

  function openProjectModal(projectId = "") {
    const project = findProject(projectId);
    dom.projectIdInput.value = project ? project.id : "";
    dom.projectNameInput.value = project ? project.name : "";
    dom.projectDescriptionInput.value = project ? project.description : "";
    dom.projectColorInput.value = project ? project.color : "blue";
    openModal("projectModal");
    setTimeout(() => dom.projectNameInput.focus(), 0);
  }

  function handleProjectSubmit(event) {
    event.preventDefault();
    const existingProject = findProject(dom.projectIdInput.value);
    const name = dom.projectNameInput.value.trim();
    if (!name) return;
    if (existingProject) {
      existingProject.name = name;
      existingProject.description = dom.projectDescriptionInput.value.trim();
      existingProject.color = dom.projectColorInput.value;
      addActivity("project", `Updated project '${name}'.`);
      showToast("Project updated.");
    } else {
      const project = {
        id: createId(),
        name,
        description: dom.projectDescriptionInput.value.trim(),
        color: dom.projectColorInput.value,
        archived: false,
        createdAt: new Date().toISOString()
      };
      state.projects.push(project);
      addActivity("project", `Created project '${name}'.`);
      showToast("Project created.");
    }
    saveState();
    closeModal("projectModal");
    renderAll();
  }

  function renderProjectSelects() {
    const projectOptions = state.projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`).join("");
    dom.taskProjectInput.innerHTML = projectOptions;
    dom.focusTaskSelect.innerHTML = `<option value="">No attached task</option>` + state.tasks
      .filter((task) => task.status !== "done")
      .map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.title)}</option>`)
      .join("");
    dom.projectFilterSelect.innerHTML = `<option value="all">All projects</option>` + projectOptions;
  }

  function renderProjectProgress(project) {
    const tasks = state.tasks.filter((task) => task.projectId === project.id);
    const done = tasks.filter((task) => task.status === "done").length;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return `
      <article class="list-item">
        <div class="panel-header">
          <div><strong>${escapeHtml(project.name)}</strong><p>${escapeHtml(project.description || "No description added.")}</p></div>
          <button class="text-button" data-edit-project="${escapeHtml(project.id)}" type="button">Edit</button>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        <p>${done} of ${tasks.length} tasks completed - ${percent}%</p>
      </article>
    `;
  }

  function bindProjectActions(root = document) {
    $$('[data-edit-project]', root).forEach((button) => {
      button.addEventListener("click", () => openProjectModal(button.dataset.editProject));
    });
  }

  function renderCalendar() {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const monthStart = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - monthStart.getDay());
    const title = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    dom.calendarTitle.textContent = title;

    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      days.push(date);
    }

    dom.calendarGrid.innerHTML = days.map((date) => {
      const iso = toLocalISO(date);
      const tasks = state.tasks.filter((task) => task.dueDate === iso);
      const classes = ["calendar-day"];
      if (date.getMonth() !== month) classes.push("outside");
      if (iso === todayISO()) classes.push("today");
      return `
        <article class="${classes.join(" ")}">
          <div class="calendar-date">${date.getDate()}</div>
          ${tasks.map((task) => `<button class="calendar-task" data-calendar-task="${escapeHtml(task.id)}" type="button">${escapeHtml(task.title)}</button>`).join("")}
        </article>
      `;
    }).join("");

    $$('[data-calendar-task]').forEach((button) => {
      button.addEventListener("click", () => openTaskModal(button.dataset.calendarTask));
    });
  }

  function changeMonth(offset) {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + offset, 1);
    renderCalendar();
  }

  function createTimerState(mode) {
    const durations = {
      focus: state && state.settings ? state.settings.focusDuration : 25,
      short: state && state.settings ? state.settings.shortBreakDuration : 5,
      long: state && state.settings ? state.settings.longBreakDuration : 15
    };
    const minutes = durations[mode] || 25;
    return {
      mode,
      totalSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      running: false,
      startedAt: ""
    };
  }

  function setFocusMode(mode) {
    pauseTimer();
    timer = createTimerState(mode);
    renderTimer();
  }

  function startTimer() {
    if (timer.running) return;
    timer.running = true;
    timer.startedAt = timer.startedAt || new Date().toISOString();
    timerInterval = window.setInterval(() => {
      timer.remainingSeconds -= 1;
      renderTimer();
      if (timer.remainingSeconds <= 0) completeTimerSession();
    }, 1000);
    addActivity("focus", `Started ${getTimerModeLabel(timer.mode).toLowerCase()}.`);
    showToast("Timer started.");
  }

  function pauseTimer() {
    if (timerInterval) window.clearInterval(timerInterval);
    timerInterval = null;
    timer.running = false;
    renderTimer();
  }

  function resetTimer() {
    pauseTimer();
    timer = createTimerState(timer.mode);
    renderTimer();
  }

  function completeTimerSession() {
    pauseTimer();
    const minutes = Math.max(1, Math.round(timer.totalSeconds / 60));
    const taskId = dom.focusTaskSelect.value;
    const session = {
      id: createId(),
      taskId,
      mode: timer.mode,
      minutes,
      startedAt: timer.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString()
    };
    state.sessions.push(session);
    if (taskId) {
      const task = findTask(taskId);
      if (task) {
        task.focusMinutes = Number(task.focusMinutes || 0) + minutes;
        task.updatedAt = new Date().toISOString();
      }
    }
    addActivity("focus", `Completed ${minutes} minute ${getTimerModeLabel(timer.mode).toLowerCase()}.`);
    saveState();
    notifyUser("Focus session complete", `You finished a ${minutes} minute ${getTimerModeLabel(timer.mode).toLowerCase()}.`);
    timer = createTimerState(timer.mode === "focus" ? "short" : "focus");
    renderAll();
    showToast("Session saved.");
  }

  function renderFocus() {
    renderTimer();
    const totalFocus = state.sessions.reduce((sum, session) => sum + session.minutes, 0);
    dom.totalFocusPill.textContent = `${totalFocus} min`;
    dom.focusSessionList.innerHTML = state.sessions.length
      ? state.sessions.slice().reverse().slice(0, 12).map((session) => {
          const task = findTask(session.taskId);
          return `
            <article class="list-item">
              <strong>${escapeHtml(getTimerModeLabel(session.mode))} - ${session.minutes} min</strong>
              <p>${task ? escapeHtml(task.title) : "No task attached"} - ${escapeHtml(formatDateTime(session.endedAt))}</p>
            </article>
          `;
        }).join("")
      : renderEmpty("No focus sessions yet.");
  }

  function renderTimer() {
    if (!dom.timerDisplay) return;
    const minutes = Math.floor(timer.remainingSeconds / 60);
    const seconds = timer.remainingSeconds % 60;
    dom.timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    dom.focusModeLabel.textContent = getTimerModeLabel(timer.mode);
    const progress = timer.totalSeconds ? Math.round(((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100) : 0;
    const ring = $(".timer-ring");
    if (ring) ring.style.setProperty("--timer-progress", `${progress}%`);
    dom.startTimerButton.textContent = timer.running ? "Running" : "Start";
    dom.startTimerButton.disabled = timer.running;
  }

  function getTimerModeLabel(mode) {
    if (mode === "short") return "Short Break";
    if (mode === "long") return "Long Break";
    return "Focus Session";
  }

  function renderNotes() {
    const query = (dom.noteSearchInput.value || "").toLowerCase().trim();
    const notes = state.notes
      .filter((note) => !query || `${note.title} ${note.body}`.toLowerCase().includes(query))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));

    dom.notesGrid.innerHTML = notes.length ? notes.map((note) => `
      <article class="note-card ${escapeHtml(note.color)}">
        <div class="panel-header">
          <div>
            <h4>${escapeHtml(note.title)}</h4>
            <span class="tag">${note.pinned ? "Pinned" : "Note"}</span>
          </div>
          <button class="text-button" data-delete-note="${escapeHtml(note.id)}" type="button">Delete</button>
        </div>
        <p>${escapeHtml(note.body || "No body added.")}</p>
      </article>
    `).join("") : renderEmpty("No notes found.");

    $$('[data-delete-note]').forEach((button) => {
      button.addEventListener("click", () => deleteNote(button.dataset.deleteNote));
    });
  }

  function handleNoteSubmit(event) {
    event.preventDefault();
    const title = dom.noteTitleInput.value.trim();
    if (!title) return;
    const note = {
      id: createId(),
      title,
      body: dom.noteBodyInput.value.trim(),
      color: dom.noteColorInput.value,
      pinned: dom.notePinnedInput.checked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.notes.push(note);
    addActivity("note", `Created note '${note.title}'.`);
    saveState();
    dom.noteForm.reset();
    renderAll();
    showToast("Note saved.");
  }

  function deleteNote(noteId) {
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    if (!confirm(`Delete note '${note.title}'?`)) return;
    state.notes = state.notes.filter((item) => item.id !== noteId);
    addActivity("note", `Deleted note '${note.title}'.`);
    saveState();
    renderAll();
    showToast("Note deleted.");
  }

  function renderGoals() {
    dom.goalsList.innerHTML = state.goals.length ? state.goals.map((goal) => {
      const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
      return `
        <article class="goal-card">
          <h4>${escapeHtml(goal.title)}</h4>
          <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
          <p>${goal.current} of ${goal.target} completed - ${percent}%</p>
          <div class="goal-actions">
            <button class="secondary-button" data-goal-dec="${escapeHtml(goal.id)}" type="button">-1</button>
            <button class="primary-button" data-goal-inc="${escapeHtml(goal.id)}" type="button">+1</button>
            <button class="danger-button" data-goal-delete="${escapeHtml(goal.id)}" type="button">Delete</button>
          </div>
        </article>
      `;
    }).join("") : renderEmpty("No goals yet.");

    $$('[data-goal-inc]').forEach((button) => button.addEventListener("click", () => updateGoal(button.dataset.goalInc, 1)));
    $$('[data-goal-dec]').forEach((button) => button.addEventListener("click", () => updateGoal(button.dataset.goalDec, -1)));
    $$('[data-goal-delete]').forEach((button) => button.addEventListener("click", () => deleteGoal(button.dataset.goalDelete)));
  }

  function handleGoalSubmit(event) {
    event.preventDefault();
    const title = dom.goalTitleInput.value.trim();
    const target = Number(dom.goalTargetInput.value);
    if (!title || !target) return;
    const goal = {
      id: createId(),
      title,
      target: Math.max(1, target),
      current: 0,
      createdAt: new Date().toISOString()
    };
    state.goals.push(goal);
    addActivity("goal", `Created goal '${goal.title}'.`);
    saveState();
    dom.goalForm.reset();
    dom.goalTargetInput.value = 3;
    renderAll();
    showToast("Goal added.");
  }

  function updateGoal(goalId, amount) {
    const goal = state.goals.find((item) => item.id === goalId);
    if (!goal) return;
    goal.current = Math.max(0, Math.min(goal.target, goal.current + amount));
    addActivity("goal", `Updated goal '${goal.title}' to ${goal.current}/${goal.target}.`);
    saveState();
    renderAll();
  }

  function deleteGoal(goalId) {
    const goal = state.goals.find((item) => item.id === goalId);
    if (!goal) return;
    if (!confirm(`Delete goal '${goal.title}'?`)) return;
    state.goals = state.goals.filter((item) => item.id !== goalId);
    addActivity("goal", `Deleted goal '${goal.title}'.`);
    saveState();
    renderAll();
    showToast("Goal deleted.");
  }

  function renderAnalytics() {
    const stats = getStats();
    renderStats(dom.analyticsStats, [
      ["Projects", stats.projects],
      ["High priority", stats.highPriority],
      ["Notes", stats.notes],
      ["Goals", stats.goals]
    ]);

    renderBarChart(dom.weeklyTaskChart, getLastSevenDays().map((day) => ({
      label: day.short,
      value: state.tasks.filter((task) => task.completedAt && toISODate(task.completedAt) === day.iso).length
    })), "done");

    renderBarChart(dom.priorityChart, ["high", "medium", "low"].map((priority) => ({
      label: PRIORITY_LABELS[priority],
      value: state.tasks.filter((task) => task.priority === priority).length
    })), "tasks");

    dom.analyticsProjectList.innerHTML = state.projects.map(renderProjectProgress).join("") || renderEmpty("No project data yet.");
    bindProjectActions(dom.analyticsProjectList);

    renderBarChart(dom.focusChart, getLastSevenDays().map((day) => ({
      label: day.short,
      value: state.sessions.filter((session) => toISODate(session.endedAt) === day.iso).reduce((sum, session) => sum + session.minutes, 0)
    })), "min");
  }

  function renderBarChart(target, rows, suffix) {
    const max = Math.max(1, ...rows.map((row) => row.value));
    target.innerHTML = rows.map((row) => {
      const percent = Math.round((row.value / max) * 100);
      return `
        <div class="chart-row">
          <span>${escapeHtml(row.label)}</span>
          <div class="chart-bar"><span style="width:${percent}%"></span></div>
          <strong>${row.value} ${escapeHtml(suffix)}</strong>
        </div>
      `;
    }).join("");
  }

  function renderTimeline() {
    dom.timelineList.innerHTML = state.activity.length ? state.activity.map(renderActivityItem).join("") : renderEmpty("No timeline activity yet.");
  }

  function renderActivityItem(item) {
    return `
      <article class="timeline-item">
        <strong>${escapeHtml(item.text)}</strong>
        <p>${escapeHtml(item.type)} - ${escapeHtml(formatDateTime(item.createdAt))}</p>
      </article>
    `;
  }

  function addActivity(type, text) {
    state.activity.unshift({
      id: createId(),
      type,
      text,
      createdAt: new Date().toISOString()
    });
    state.activity = state.activity.slice(0, 120);
  }

  function openModal(modalId) {
    const modal = $(`#${modalId}`);
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modalId) {
    const modal = $(`#${modalId}`);
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  function handleKeyboardShortcuts(event) {
    const target = event.target;
    const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
      return;
    }
    if (event.key === "Escape") {
      closeCommandPalette();
      closeModal("taskModal");
      closeModal("projectModal");
      return;
    }
    if (isTyping) return;
    if (event.key.toLowerCase() === "n") openTaskModal();
    if (event.key.toLowerCase() === "p") openProjectModal();
    if (event.key === "/") {
      event.preventDefault();
      setView("board");
      setTimeout(() => dom.taskSearchInput.focus(), 0);
    }
  }

  function openCommandPalette() {
    dom.commandPalette.classList.add("active");
    dom.commandPalette.setAttribute("aria-hidden", "false");
    dom.commandInput.value = "";
    renderCommandResults();
    setTimeout(() => dom.commandInput.focus(), 0);
  }

  function closeCommandPalette() {
    dom.commandPalette.classList.remove("active");
    dom.commandPalette.setAttribute("aria-hidden", "true");
  }

  function renderCommandResults() {
    if (!dom.commandResults) return;
    const query = (dom.commandInput.value || "").toLowerCase().trim();
    const commands = [
      { type: "Action", title: "Create new task", hint: "Open task editor", run: () => openTaskModal() },
      { type: "Action", title: "Create new project", hint: "Open project editor", run: () => openProjectModal() },
      { type: "Action", title: "Start focus mode", hint: "Open focus timer", run: () => setView("focus") },
      { type: "Action", title: "Export backup", hint: "Download JSON backup", run: () => exportData() },
      ...state.tasks.map((task) => ({ type: "Task", title: task.title, hint: STATUS_LABELS[task.status], run: () => openTaskModal(task.id) })),
      ...state.projects.map((project) => ({ type: "Project", title: project.name, hint: project.description || "Project", run: () => openProjectModal(project.id) })),
      ...state.notes.map((note) => ({ type: "Note", title: note.title, hint: note.body || "Saved note", run: () => setView("notes") })),
      ...state.goals.map((goal) => ({ type: "Goal", title: goal.title, hint: `${goal.current}/${goal.target} completed`, run: () => setView("goals") }))
    ];

    const results = commands.filter((item) => !query || `${item.type} ${item.title} ${item.hint}`.toLowerCase().includes(query)).slice(0, 12);
    dom.commandResults.innerHTML = results.length ? results.map((item, index) => `
      <button class="command-result" data-command-index="${index}" type="button">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.type)} - ${escapeHtml(item.hint)}</span>
      </button>
    `).join("") : renderEmpty("No matching command found.");

    $$('[data-command-index]').forEach((button) => {
      button.addEventListener("click", () => {
        const item = results[Number(button.dataset.commandIndex)];
        if (!item) return;
        closeCommandPalette();
        item.run();
      });
    });
  }

  function syncSettingsInputs() {
    dom.focusDurationInput.value = state.settings.focusDuration;
    dom.shortBreakInput.value = state.settings.shortBreakDuration;
    dom.longBreakInput.value = state.settings.longBreakDuration;
    dom.settingsStatus.textContent = state.settings.notificationsEnabled
      ? "Notifications are enabled. Data is still stored locally in your browser."
      : "Settings are stored locally in your browser.";
  }

  function saveSettingsFromInputs() {
    state.settings.focusDuration = clamp(Number(dom.focusDurationInput.value), 1, 120);
    state.settings.shortBreakDuration = clamp(Number(dom.shortBreakInput.value), 1, 60);
    state.settings.longBreakDuration = clamp(Number(dom.longBreakInput.value), 1, 90);
    addActivity("settings", "Updated focus timer settings.");
    saveState();
    resetTimer();
    renderAll();
    showToast("Settings saved.");
  }

  function enableNotifications() {
    if (!("Notification" in window)) {
      showToast("Browser notifications are not supported.");
      return;
    }
    Notification.requestPermission().then((permission) => {
      state.settings.notificationsEnabled = permission === "granted";
      addActivity("settings", state.settings.notificationsEnabled ? "Enabled browser notifications." : "Notification permission was not granted.");
      saveState();
      renderAll();
      showToast(state.settings.notificationsEnabled ? "Notifications enabled." : "Notifications not enabled.");
    });
  }

  function notifyUser(title, body) {
    if (state.settings.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  function scheduleReminderCheck() {
    checkDueReminders();
    window.setInterval(checkDueReminders, 60000);
  }

  function checkDueReminders() {
    const today = todayISO();
    state.settings.reminderLog = state.settings.reminderLog || {};
    state.tasks.forEach((task) => {
      const key = `${task.id}:${today}`;
      if (task.status === "done" || task.dueDate !== today || state.settings.reminderLog[key]) return;
      state.settings.reminderLog[key] = true;
      notifyUser("Task due today", task.title);
    });
    saveState();
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "DevTasker JS",
      version: APP_VERSION,
      data: state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `devtasker-backup-${todayISO()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    addActivity("backup", "Exported workspace backup.");
    saveState();
    renderAll();
  }

  function importData(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const imported = parsed.data || parsed;
        const clean = normalizeState(imported);
        Object.keys(state).forEach((key) => delete state[key]);
        Object.assign(state, clean);
        addActivity("backup", "Imported workspace backup.");
        saveState();
        applyTheme();
        renderAll();
        showToast("Backup imported.");
      } catch (error) {
        console.error(error);
        showToast("Invalid backup file.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function clearCompletedTasks() {
    const completedCount = state.tasks.filter((task) => task.status === "done").length;
    if (!completedCount) {
      showToast("No completed tasks to clear.");
      return;
    }
    if (!confirm(`Clear ${completedCount} completed tasks?`)) return;
    state.tasks = state.tasks.filter((task) => task.status !== "done");
    addActivity("task", `Cleared ${completedCount} completed tasks.`);
    saveState();
    renderAll();
    showToast("Completed tasks cleared.");
  }

  function resetWorkspace() {
    if (!confirm("Reset all DevTasker data in this browser?")) return;
    const clean = createSeedState();
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, clean);
    saveState();
    applyTheme();
    timer = createTimerState("focus");
    renderAll();
    showToast("Workspace reset.");
  }

  function findTask(taskId) {
    return state.tasks.find((task) => task.id === taskId);
  }

  function findProject(projectId, projects = state.projects) {
    return projects.find((project) => project.id === projectId);
  }

  function getSubtaskPercent(task) {
    if (!task.subtasks.length) return 0;
    return Math.round((getDoneSubtaskCount(task) / task.subtasks.length) * 100);
  }

  function getDoneSubtaskCount(task) {
    return task.subtasks.filter((subtask) => subtask.done).length;
  }

  function sortByPriority(a, b) {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  }

  function getNextDueDate(dateISO, recurring) {
    const date = fromISODate(dateISO);
    if (recurring === "daily") date.setDate(date.getDate() + 1);
    if (recurring === "weekly") date.setDate(date.getDate() + 7);
    if (recurring === "monthly") date.setMonth(date.getMonth() + 1);
    return toLocalISO(date);
  }

  function getLastSevenDays() {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      days.push({
        iso: toLocalISO(date),
        short: date.toLocaleDateString(undefined, { weekday: "short" })
      });
    }
    return days;
  }

  function addDaysISO(dateISO, amount) {
    const date = fromISODate(dateISO);
    date.setDate(date.getDate() + amount);
    return toLocalISO(date);
  }

  function todayISO() {
    return toLocalISO(new Date());
  }

  function toLocalISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function fromISODate(dateISO) {
    const [year, month, day] = String(dateISO).split("-").map(Number);
    return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1);
  }

  function toISODate(dateTime) {
    return toLocalISO(new Date(dateTime));
  }

  function formatDate(dateISO) {
    if (!dateISO) return "No date";
    return fromISODate(dateISO).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function formatDateTime(dateTime) {
    return new Date(dateTime).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function clamp(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderEmpty(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    dom.toastStack.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }
})();
