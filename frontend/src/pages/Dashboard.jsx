import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Plus, Search, LogOut, LayoutDashboard, ListTodo, Clock3, CircleCheck, Trash2, Pencil, X, CalendarDays, SlidersHorizontal, Sparkles } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { title: '', description: '', status: 'Pending', priority: 'Medium', dueDate: '' };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [filters, setFilters] = useState({ status: 'All', priority: 'All', search: '' });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status !== 'All') params.status = filters.status;
      if (filters.priority !== 'All') params.priority = filters.priority;
      if (filters.search.trim()) params.search = filters.search.trim();
      const [taskResponse, statsResponse] = await Promise.all([
        api.get('/tasks', { params }), api.get('/tasks/stats')
      ]);
      setTasks(taskResponse.data.tasks);
      setStats(statsResponse.data);
    } catch (err) { setError(err.response?.data?.message || 'Could not load tasks.'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setModal(true); };
  const openEdit = (task) => {
    setEditing(task._id);
    setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '' });
    setError(''); setModal(true);
  };
  const saveTask = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { ...form, dueDate: form.dueDate || null };
      if (editing) await api.put(`/tasks/${editing}`, payload);
      else await api.post('/tasks', payload);
      setModal(false); await load();
    } catch (err) { setError(err.response?.data?.message || 'Could not save task.'); }
  };
  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try { await api.delete(`/tasks/${id}`); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete task.'); }
  };
  const changeStatus = async (task, status) => {
    try { await api.put(`/tasks/${task._id}`, { status }); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update task.'); }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/"><span className="brand-icon"><CheckSquare size={20}/></span> taskflow</a>
        <div className="side-label">WORKSPACE</div>
        <div className="side-link active"><LayoutDashboard size={17}/> Overview</div>
        <div className="side-link"><ListTodo size={17}/> All tasks <span className="side-count">{stats.total}</span></div>
        <div className="sidebar-bottom">
          <div className="tip-card"><Sparkles size={17}/><b>Keep going!</b><p>Every completed task is progress worth celebrating.</p></div>
          <div className="profile"><div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div><div className="profile-info"><b>{user?.name}</b><small>{user?.email}</small></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Overview</div><div className="topbar-right"><span className="today-label"><CalendarDays size={15}/>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><div className="avatar small">{user?.name?.charAt(0).toUpperCase()}</div></div></header>
        <section className="welcome-row"><div><span className="eyebrow">{greeting.toUpperCase()}</span><h1>Let's make today count<span className="wave"> ✦</span></h1><p className="muted">Here's what's happening with your tasks.</p></div><button className="primary-btn" onClick={openCreate}><Plus size={17}/> New task</button></section>

        <section className="stats-grid">
          <StatCard label="Total tasks" value={stats.total} icon={<ListTodo/>} tone="blue" note="All your tasks"/>
          <StatCard label="To do" value={stats.pending} icon={<Clock3/>} tone="orange" note="Waiting to start"/>
          <StatCard label="In progress" value={stats.inProgress} icon={<SlidersHorizontal/>} tone="purple" note="Currently working on"/>
          <StatCard label="Completed" value={stats.completed} icon={<CircleCheck/>} tone="green" note="Nicely done"/>
        </section>

        <section className="tasks-section">
          <div className="section-heading"><div><h2>Your tasks</h2><p className="muted">Manage and keep track of your work.</p></div><span className="task-count">{tasks.length} shown</span></div>
          <div className="filter-bar">
            <div className="search-box"><Search size={17}/><input placeholder="Search tasks..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}/>{filters.search && <button className="clear-search" onClick={() => setFilters({ ...filters, search: '' })}><X size={14}/></button>}</div>
            <select aria-label="Filter by status" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
            <select aria-label="Filter by priority" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}><option>All</option><option>Low</option><option>Medium</option><option>High</option></select>
          </div>
          {error && !modal && <div className="error-box page-error">{error}<button onClick={() => setError('')}><X size={14}/></button></div>}
          {loading ? <div className="empty-state">Loading your tasks…</div> : tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon"><ListTodo size={25}/></div><h3>No tasks found</h3><p>{filters.search || filters.status !== 'All' || filters.priority !== 'All' ? 'Try changing your search or filters.' : 'Your task list is clear. Add your first task to get started.'}</p>{!filters.search && filters.status === 'All' && filters.priority === 'All' && <button className="secondary-btn" onClick={openCreate}><Plus size={16}/> Create a task</button>}</div>
          ) : <div className="task-list">{tasks.map(task => <article className={`task-card ${task.status === 'Completed' ? 'is-complete' : ''}`} key={task._id}>
            <button className={`task-check ${task.status === 'Completed' ? 'checked' : ''}`} title="Mark completed" onClick={() => changeStatus(task, task.status === 'Completed' ? 'Pending' : 'Completed')}>{task.status === 'Completed' ? '✓' : ''}</button>
            <div className="task-main"><div className="task-title-row"><h3>{task.title}</h3><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></div>{task.description && <p className="task-description">{task.description}</p>}<div className="task-meta"><span><CalendarDays size={13}/>{dateLabel(task.dueDate)}</span><span className={`status status-${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></div></div>
            <div className="task-actions"><button className="icon-btn" title="Edit task" onClick={() => openEdit(task)}><Pencil size={16}/></button><button className="icon-btn danger-hover" title="Delete task" onClick={() => deleteTask(task._id)}><Trash2 size={16}/></button></div>
          </article>)}</div>}
        </section>
        <footer className="footer-note">Made for a more focused day <span>✦</span></footer>
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(false)}><section className="task-modal"><div className="modal-heading"><div><span className="eyebrow">{editing ? 'UPDATE DETAILS' : 'NEW ITEM'}</span><h2>{editing ? 'Edit task' : 'Create a task'}</h2></div><button className="icon-btn" onClick={() => setModal(false)}><X/></button></div><form onSubmit={saveTask}>
        <label>Task title<input autoFocus maxLength="120" placeholder="What needs to get done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required/></label>
        <label>Description <span className="optional">· optional</span><textarea rows="3" maxLength="1000" placeholder="Add a few details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
        <div className="form-two"><label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label></div>
        <label>Due date <span className="optional">· optional</span><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/></label>
        {error && <div className="error-box">{error}</div>}
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(false)}>Cancel</button><button className="primary-btn">{editing ? 'Save changes' : 'Create task'} <span>→</span></button></div>
      </form></section></div>}
    </div>
  );
}

function StatCard({ label, value, icon, tone, note }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></article>;
}
