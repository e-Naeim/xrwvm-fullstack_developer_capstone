import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const { setUser, loading } = useAuth(); const navigate = useNavigate();
  const [params] = useSearchParams();
  async function submit(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { const user = await api('login', { method: 'POST', body: JSON.stringify({ userName, password }) });
      setUser(user); const next = params.get('next'); navigate(next?.startsWith('/postreview/') ? next : '/dealers', { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="form-card"><p className="eyebrow">WELCOME BACK</p><h1>Login</h1><p className="muted">Your experience can help someone choose with confidence.</p>
    <form onSubmit={submit}>{error && <p role="alert" className="error">{error}</p>}
    <label>Username<input autoComplete="username" required value={userName} onChange={e => setUserName(e.target.value)} /></label>
    <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
    <div className="actions"><button disabled={busy || loading}>{busy ? 'Logging in…' : 'Login'}</button><Link className="button secondary" to="/dealers">Cancel</Link></div></form>
    <p>New here? <Link to="/register">Register now</Link></p></section>;
}
