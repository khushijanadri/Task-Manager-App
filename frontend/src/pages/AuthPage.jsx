import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, ListTodo } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="brand light"><span className="brand-icon"><CheckSquare size={20}/></span> taskflow</div>
        <div className="visual-copy">
          <span className="eyebrow">MAKE SPACE FOR WHAT MATTERS</span>
          <h1>Small steps.<br/><em>Big progress.</em></h1>
          <p>Bring your tasks together, stay focused, and make every day count.</p>
          <div className="preview-card"><div className="preview-top"><span>YOUR DAY, IN FOCUS</span><span className="live-dot"/></div><div className="preview-task"><span className="fake-check done">✓</span><div><b>Plan the week</b><small>Personal · Today</small></div><span className="mini-tag">Done</span></div><div className="preview-task"><span className="fake-check"/><div><b>Finish project proposal</b><small>Work · Today</small></div><span className="mini-tag purple">In progress</span></div><div className="preview-task"><span className="fake-check"/><div><b>Read 10 pages</b><small>Personal · Tomorrow</small></div><span className="mini-tag">To do</span></div></div>
        </div>
        <span className="visual-foot">A calmer way to get things done.</span>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand"><CheckSquare/> taskflow</div>
        <div className="auth-form-wrap">
          <div className="form-icon"><ListTodo size={23}/></div>
          <span className="eyebrow">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</span>
          <h2>{isRegister ? 'Create your account' : 'Sign in to Taskflow'}</h2>
          <p className="muted">{isRegister ? 'A little more focus starts here.' : 'Pick up where you left off.'}</p>
          <form onSubmit={submit}>
            {isRegister && <label>Your name<input name="name" value={form.name} onChange={update} placeholder="e.g. Alex Morgan" required maxLength="60"/></label>}
            <label>Email address<input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required/></label>
            <label>Password<input name="password" type="password" value={form.password} onChange={update} placeholder="At least 8 characters" minLength="8" required/></label>
            {error && <div className="error-box">{error}</div>}
            <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <span>→</span></button>
          </form>
          <p className="switch-auth">{isRegister ? 'Already have an account?' : "Don't have an account?"} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create one'}</Link></p>
        </div>
        <span className="auth-bottom">© 2026 Taskflow. Make today count.</span>
      </section>
    </main>
  );
}
