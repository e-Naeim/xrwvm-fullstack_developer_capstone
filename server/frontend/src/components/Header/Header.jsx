import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { api } from '../../api';
export default function Header() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try { await api('logout', { method: 'POST' }); setUser(null); navigate('/dealers'); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <><header className="site-header"><a href="/" className="brand">BEST<span>CARS</span><small>FIND YOUR NEXT CHAPTER</small></a>
    <nav aria-label="Main navigation"><a href="/">Home</a><Link to="/dealers">Dealerships</Link><a href="/about/">About Us</a><a href="/contact/">Contact Us</a></nav>
    <div className="account">{user ? <><span>{user.userName}</span><button className="button secondary" disabled={busy} onClick={logout}>{busy ? 'Logging out…' : 'Logout'}</button></> : <><Link to="/login">Login</Link><Link className="button" to="/register">Register</Link></>}</div>
    </header>{error && <p className="error" role="alert">{error}</p>}</>;
}
