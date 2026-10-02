const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const Dealers = require('../dealership');
const Reviews = require('../review');
const { app } = require('../app');
const result = data => ({ sort: () => ({ lean: async () => data }) });
afterEach(() => mock.restoreAll());
test('API health', async () => { const res = await request(app).get('/'); assert.equal(res.status, 200); });
test('all dealerships', async () => {
  mock.method(Dealers, 'find', query => { assert.deepEqual(query, undefined); return result([{ id: 3 }]); });
  const res = await request(app).get('/fetchDealers'); assert.equal(res.body[0].id, 3);
});
test('Kansas dealership filter', async () => {
  mock.method(Dealers, 'find', query => { assert.deepEqual(query, { state: 'Kansas' }); return result([{ state: 'Kansas' }]); });
  const res = await request(app).get('/fetchDealers/Kansas'); assert.equal(res.body[0].state, 'Kansas');
});
test('All state removes filter', async () => {
  mock.method(Dealers, 'find', query => { assert.deepEqual(query, {}); return result([]); });
  assert.equal((await request(app).get('/fetchDealers/All')).status, 200);
});
test('single dealer', async () => {
  mock.method(Dealers, 'find', query => { assert.deepEqual(query, { id: 3 }); return { lean: async () => [{ id: 3 }] }; });
  assert.equal((await request(app).get('/fetchDealer/3')).body[0].id, 3);
});
test('invalid dealership id', async () => { assert.equal((await request(app).get('/fetchDealer/not-an-id')).status, 400); });
test('dealer reviews newest first', async () => {
  mock.method(Reviews, 'find', query => { assert.deepEqual(query, { dealership: 29 }); return { sort: order => { assert.deepEqual(order, { time: -1, id: -1 }); return { lean: async () => [{ id: 50 }] }; } }; });
  assert.equal((await request(app).get('/fetchReviews/dealer/29')).body[0].id, 50);
});
test('review validation', async () => { assert.equal((await request(app).post('/insert_review').send({ review: '' })).status, 400); });
test('backend failure returns controlled 500', async () => {
  mock.method(Dealers, 'find', () => { throw new Error('test failure'); });
  assert.equal((await request(app).get('/fetchDealers')).status, 500);
});
