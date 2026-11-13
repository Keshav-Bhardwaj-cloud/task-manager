import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, CircleDashed, LogOut, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteTask, fetchTasks, updateTask, createTask } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';

const emptyState = {
  all: 'You have no tasks yet. Create your first one to start organizing your work.',
  active: 'No open tasks right now. You are all caught up.',
  completed: 'No completed tasks yet. Finish a task to see it here.',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, hasNextPage: false });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskModal, setTaskModal] = useState({ isOpen: false, mode: 'create', task: null });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const params = {
          page: pagination.page,
          limit: 5,
          sort,
          search: search.trim() || undefined,
          ...(statusFilter === 'all' ? {} : { isCompleted: statusFilter === 'completed' ? 'true' : 'false' }),
        };

        const response = await fetchTasks(params);
        if (!active) return;

        setTasks(response?.data?.tasks || []);
        setPagination(response?.data?.pagination || { page: 1, limit: 5, hasNextPage: false });
        setError('');
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || 'Unable to load your tasks.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pagination.page, search, sort, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.isCompleted).length;
    const remaining = total - completed;

    return {
      total,
      completed,
      remaining,
    };
  }, [tasks]);

  const handleCreateOrUpdateTask = async (payload) => {
    if (taskModal.mode === 'edit' && taskModal.task) {
      const response = await updateTask(taskModal.task._id, payload);
      setTasks((current) =>
        current.map((task) => (task._id === taskModal.task._id ? response.data : task)),
      );
      return response;
    }

    const response = await createTask(payload);
    setTasks((current) => [response.data, ...current]);
    setPagination((current) => ({ ...current, page: 1 }));
    return response;
  };

  const handleToggleTask = async (task) => {
    const result = await updateTask(task._id, { isCompleted: !task.isCompleted, title: task.title });
    setTasks((current) => current.map((item) => (item._id === task._id ? result.data : item)));
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm('Delete this task? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    await deleteTask(taskId);
    setTasks((current) => current.filter((task) => task._id !== taskId));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const currentEmptyState = emptyState[statusFilter] || emptyState.all;

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark sidebar-brand">
          <div className="brand-icon">T</div>
          <span>TaskPilot</span>
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar navigation">
          <button type="button" className="nav-item active">
            Dashboard
          </button>
          <button type="button" className="nav-item">
            Tasks
          </button>
          <button type="button" className="nav-item">
            Activity
          </button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="button button-secondary logout-button" onClick={handleLogout}>
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>Good morning</h1>
          </div>
          <button type="button" className="button button-primary" onClick={() => setTaskModal({ isOpen: true, mode: 'create', task: null })}>
            <Plus size={18} />
            New task
          </button>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="stat-card">
            <span>Completed</span>
            <strong>{stats.completed}</strong>
          </div>
          <div className="stat-card">
            <span>Open</span>
            <strong>{stats.remaining}</strong>
          </div>
        </section>

        <section className="task-panel">
          <div className="task-panel-header">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>Your tasks</h2>
            </div>

            <div className="toolbar">
              <label className="search-box" htmlFor="task-search">
                <Search size={16} />
                <input
                  id="task-search"
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPagination((current) => ({ ...current, page: 1 }));
                  }}
                  placeholder="Search tasks"
                />
              </label>

              <div className="inline-select">
                <SlidersHorizontal size={16} />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <select value={sort} onChange={(event) => setSort(event.target.value)} className="inline-select compact-select">
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>

          {error ? <div className="notice notice-error">{error}</div> : null}

          {isLoading ? (
            <div className="task-list-loading">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <CircleDashed size={36} />
              <h3>No tasks found</h3>
              <p>{currentEmptyState}</p>
              <button type="button" className="button button-primary" onClick={() => setTaskModal({ isOpen: true, mode: 'create', task: null })}>
                Create a task
              </button>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article key={task._id} className={`task-item ${task.isCompleted ? 'done' : ''}`}>
                  <button type="button" className="task-toggle" onClick={() => handleToggleTask(task)} aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'active' : 'completed'}`}>
                    {task.isCompleted ? <CheckCheck size={18} /> : <CircleDashed size={18} />}
                  </button>

                  <div className="task-copy">
                    <h3>{task.title}</h3>
                    <p>{task.isCompleted ? 'Completed' : 'Open task'}</p>
                  </div>

                  <div className="task-actions">
                    <button type="button" className="button button-secondary small-button" onClick={() => setTaskModal({ isOpen: true, mode: 'edit', task })}>
                      Edit
                    </button>
                    <button type="button" className="button button-danger small-button" onClick={() => handleDeleteTask(task._id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination.hasNextPage || pagination.page > 1 ? (
            <div className="pagination-bar">
              <button type="button" className="button button-secondary" onClick={() => setPagination((current) => ({ ...current, page: Math.max(1, current.page - 1) }))} disabled={pagination.page === 1}>
                Previous
              </button>
              <span>Page {pagination.page}</span>
              <button type="button" className="button button-secondary" onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} disabled={!pagination.hasNextPage}>
                Next
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <TaskModal
        key={`${taskModal.mode}-${taskModal.task?._id ?? 'new'}`}
        isOpen={taskModal.isOpen}
        mode={taskModal.mode}
        task={taskModal.task}
        onClose={() => setTaskModal({ isOpen: false, mode: 'create', task: null })}
        onSubmit={async (payload) => {
          const result = await handleCreateOrUpdateTask(payload);
          setTaskModal({ isOpen: false, mode: 'create', task: null });
          return result;
        }}
      />
    </div>
  );
}
