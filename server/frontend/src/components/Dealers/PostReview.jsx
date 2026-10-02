import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
export default function PostReview() {
  const { id } = useParams(); const { user, loading } = useAuth(); const navigate = useNavigate();
  const [dealer, setDealer] = useState(null); const [cars, setCars] = useState([]);
  const [review, setReview] = useState(''); const [purchase, setPurchase] = useState(false);
  const [carId, setCarId] = useState(''); const [year, setYear] = useState('2023'); const [date, setDate] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; Promise.all([api('dealer/' + id), api('get_cars')]).then(([d,c]) => { if (active) { setDealer(d.dealer[0]); setCars(c.CarModels); } }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [id]);
  if (loading) return <p role="status">Checking your session…</p>;
  if (!user) return <Navigate to={'/login?next=/postreview/' + id} replace />;
  async function submit(event) {
    event.preventDefault(); if (busy) return; setError(''); setBusy(true);
    const car = cars.find(c => String(c.id) === carId);
    try { await api('add_review', { method:'POST', body: JSON.stringify({ dealership:Number(id), review, purchase, purchase_date:date, car_make:car?.CarMake || '', car_model:car?.CarModel || '', car_year:Number(year) }) }); navigate('/dealer/' + id, { replace:true }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="form-card wide"><Link className="back" to={'/dealer/' + id}>← Back to dealership</Link><p className="eyebrow">YOUR EXPERIENCE MATTERS</p><h1>Write a review</h1><h2>{dealer?.full_name || 'Loading dealership…'}</h2><p className="muted">Posting as {user.firstName || user.userName} {user.lastName}</p><form onSubmit={submit}>
    {error && <p className="error" role="alert">{error}</p>}<label>Your review<textarea required maxLength="5000" rows="6" value={review} onChange={e => setReview(e.target.value)} placeholder="Tell us about your visit, the service, and what stood out." /></label>
    <label className="checkbox"><input type="checkbox" checked={purchase} onChange={e => setPurchase(e.target.checked)} />I purchased a vehicle from this dealership</label>
    {purchase && <fieldset><legend>Purchase details</legend><label>Purchase date<input type="date" required max={new Date().toISOString().slice(0,10)} value={date} onChange={e => setDate(e.target.value)} /></label><label>Car make and model<select required value={carId} onChange={e => setCarId(e.target.value)}><option value="">Choose make and model</option>{cars.map(car => <option key={car.id} value={car.id}>{car.CarMake} {car.CarModel} ({car.year})</option>)}</select></label><label>Car year<select value={year} onChange={e => setYear(e.target.value)}>{Array.from({length:9},(_,i)=>2023-i).map(y=><option key={y}>{y}</option>)}</select></label></fieldset>}
    <div className="actions"><button disabled={busy || !dealer}>{busy ? 'Posting…' : 'Post review'}</button><Link className="button secondary" to={'/dealer/' + id}>Cancel</Link></div></form></section>;
}
