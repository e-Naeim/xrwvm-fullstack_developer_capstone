import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
export default function Register() {
  const [form, setForm] = useState({ userName: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const { setUser, loading } = useAuth(); const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); if (busy) return; setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try { setUser(await api('register', { method: 'POST', body: JSON.stringify(form) })); navigate('/dealers', { replace: true }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const fields = [['userName','Username','text','username'],['firstName','First name','text','given-name'],['lastName','Last name','text','family-name'],['email','Email','email','email'],['password','Password','password','new-password'],['confirmPassword','Confirm password','password','new-password']];
  return <section className="form-card"><p className="eyebrow">JOIN THE CONVERSATION</p><h1>Create an account</h1><p className="muted">Save your voice. Share your dealership experience.</p>
    <form onSubmit={submit}>{error && <p role="alert" className="error">{error}</p>}
      {fields.map(([key, label, type, autoComplete]) => <label key={key}>{label}<input type={type} autoComplete={autoComplete} required minLength={type === 'password' ? 8 : undefined} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
      <small>Use at least 8 characters. Avoid common passwords.</small><div className="actions"><button disabled={busy || loading}>{busy ? 'Creating account…' : 'Register'}</button><Link className="button secondary" to="/dealers">Cancel</Link></div>
    </form><p>Already registered? <Link to="/login">Login</Link></p></section>;
}
