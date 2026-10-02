import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
export default function Dealers() {
  const { user } = useAuth(); const [dealers, setDealers] = useState([]);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams(); const state = params.get('state') || 'All';
  useEffect(() => { let active = true;
    api('get_dealers').then(data => { if (active) setDealers(data.dealers); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const states = [...new Set(dealers.map(dealer => dealer.state))].sort();
  const shown = state === 'All' ? dealers : dealers.filter(dealer => dealer.state === state);
  return <><section className="page-heading"><div><p className="eyebrow">LOCAL KNOWLEDGE. NATIONAL REACH.</p><h1>Find your dealership</h1><p>Explore branches and honest customer experiences.</p></div><div className="stat"><strong>{dealers.length}</strong><span>dealerships nationwide</span></div></section>
    <section className="list-card"><div className="toolbar"><h2>Dealership directory</h2><label className="filter">State<select aria-label="Filter by state" value={state} onChange={e => setParams(e.target.value === 'All' ? {} : { state: e.target.value })}><option value="All">All States</option>{states.map(s => <option key={s}>{s}</option>)}</select></label></div>
      {error && <p role="alert" className="error">{error}</p>}{loading ? <p role="status">Loading dealerships…</p> : <><p className="result-count" aria-live="polite">{shown.length} dealerships{state !== 'All' ? ' in ' + state : ''}</p><div className="table-scroll"><table><thead><tr><th>ID</th><th>Dealer Name</th><th>City</th><th>Address</th><th>Zip</th><th>State</th>{user && <th>Review Dealer</th>}</tr></thead><tbody>{shown.map(d => <tr key={d.id}><td>{d.id}</td><td><Link to={'/dealer/' + d.id}>{d.full_name}</Link></td><td>{d.city}</td><td>{d.address}</td><td>{d.zip}</td><td>{d.state}</td>{user && <td><Link className="review-link" to={'/postreview/' + d.id}>Write a review ↗</Link></td>}</tr>)}</tbody></table></div>{!shown.length && <p>No dealerships in this state.</p>}</>}
    </section></>;
}
