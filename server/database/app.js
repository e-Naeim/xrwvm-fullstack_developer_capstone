const express = require('express');
const mongoose = require('mongoose');
const Dealerships = require('./dealership');
const Reviews = require('./review');
const { seed } = require('./seed');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

app.get('/', (req, res) => res.json({ service: 'Mongoose API', status: 'ok' }));
app.get('/fetchReviews', asyncRoute(async (req, res) =>
  res.json(await Reviews.find().sort({ time: -1, id: -1 }).lean())));
app.get('/fetchReviews/dealer/:id', asyncRoute(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid dealer id' });
  res.json(await Reviews.find({ dealership: Number(req.params.id) }).sort({ time: -1, id: -1 }).lean());
}));
app.get('/fetchDealers', asyncRoute(async (req, res) =>
  res.json(await Dealerships.find().sort({ id: 1 }).lean())));
app.get('/fetchDealers/:state', asyncRoute(async (req, res) => {
  const query = req.params.state === 'All' ? {} : { state: req.params.state };
  res.json(await Dealerships.find(query).sort({ id: 1 }).lean());
}));
app.get('/fetchDealer/:id', asyncRoute(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid dealer id' });
  res.json(await Dealerships.find({ id: Number(req.params.id) }).lean());
}));
const Counter = mongoose.model('counter', new mongoose.Schema({ _id: String, value: Number }));
app.post('/insert_review', asyncRoute(async (req, res) => {
  const d = req.body;
  if (!d || typeof d.name !== 'string' || typeof d.review !== 'string' ||
      !d.review.trim() || d.review.length > 5000 || typeof d.purchase !== 'boolean' ||
      !Number.isInteger(d.dealership)) return res.status(400).json({ error: 'Invalid review' });
  if (!await Dealerships.exists({ id: d.dealership })) return res.status(404).json({ error: 'Dealer not found' });
  if (d.purchase && (!d.purchase_date || !d.car_make || !d.car_model ||
      !Number.isInteger(d.car_year) || d.car_year < 2015 || d.car_year > 2023))
    return res.status(400).json({ error: 'Invalid purchase details' });
  const counter = await Counter.findOneAndUpdate({ _id: 'review' }, { $inc: { value: 1 } }, { new: true });
  const saved = await Reviews.create({ id: counter.value, name: d.name.trim(),
    user_id: d.user_id, dealership: d.dealership, review: d.review.trim(),
    purchase: d.purchase, purchase_date: d.purchase_date || '',
    car_make: d.car_make || '', car_model: d.car_model || '',
    car_year: d.car_year || null, time: new Date() });
  res.status(201).json(saved);
}));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err instanceof SyntaxError ? 400 : 500).json({ error: 'Request could not be processed' });
});
async function initialize(uri) {
  await mongoose.connect(uri || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/dealershipsDB');
  await seed();
  const latest = await Reviews.findOne().sort({ id: -1 });
  await Counter.updateOne({ _id: 'review' }, { $max: { value: latest ? latest.id : 0 } }, { upsert: true });
}
if (require.main === module) {
  initialize().then(() => app.listen(process.env.PORT || 3030, '0.0.0.0', () =>
    console.log('Dealership API listening on port ' + (process.env.PORT || 3030))))
    .catch(err => { console.error(err.message); process.exit(1); });
}
module.exports = { app, initialize };
