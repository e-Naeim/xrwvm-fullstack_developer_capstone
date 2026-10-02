import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import positive from '../assets/positive.png';
import neutral from '../assets/neutral.png';
import negative from '../assets/negative.png';
const icons = { positive, neutral, negative };
export default function Dealer() {
  const { id } = useParams(); const { user } = useAuth();
  const [dealer, setDealer] = useState(null); const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; setLoading(true); setError('');
    Promise.all([api('dealer/' + id), api('reviews/dealer/' + id)]).then(([d, r]) => {
      if (active) { setDealer(d.dealer[0]); setReviews(r.reviews); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  if (loading) return <p role="status">Loading dealership…</p>;
  if (error) return <p className="error" role="alert">{error}</p>;
  return <><Link className="back" to="/dealers">← All dealerships</Link><section className="page-heading"><div><p className="eyebrow">{dealer.state} · {dealer.city}</p><h1>{dealer.full_name}</h1><p>{dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}</p></div>{user ? <Link className="button" to={'/postreview/' + id}>Write a review</Link> : <Link className="button" to={'/login?next=/postreview/' + id}>Login to review</Link>}</section>
    <h2>Customer reviews <span className="count">{reviews.length}</span></h2><p className="muted">Newest first. Sentiment is automatically analyzed from each review.</p>
    <div className="review-grid">{reviews.map(review => <article key={review.id} className="card review-card"><div className="review-top"><span className={'sentiment ' + review.sentiment}><img src={icons[review.sentiment]} alt="" />{review.sentiment}</span><small>{review.time ? new Date(review.time).toLocaleDateString() : ''}</small></div><p className="review-text">{review.review}</p><strong>{review.name}</strong>{review.purchase && <p className="purchase">Purchased {review.car_year} {review.car_make} {review.car_model}<br /><small>Purchase date: {review.purchase_date}</small></p>}</article>)}</div>
    {!reviews.length && <div className="empty"><h3>Be the first to share your experience</h3><p>No reviews yet for this dealership.</p></div>}</>;
}
