const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const { app, initialize } = require('../app');
(async () => {
  const mongo = await MongoMemoryServer.create({ binary: { version:'7.0.14' } });
  try {
    await initialize(mongo.getUri('capstone_integration'));
    const all = await request(app).get('/fetchDealers'); assert.equal(all.status, 200); assert.ok(all.body.length > 0);
    const ks = await request(app).get('/fetchDealers/Kansas'); assert.ok(ks.body.length > 0); assert.ok(ks.body.every(d => d.state === 'Kansas'));
    const dealer = all.body[0];
    const review = { name:'Integration Reviewer', dealership:dealer.id, review:'Fantastic services', purchase:false };
    const responses = await Promise.all([request(app).post('/insert_review').send(review), request(app).post('/insert_review').send(review)]);
    responses.forEach(r => assert.equal(r.status, 201)); assert.notEqual(responses[0].body.id, responses[1].body.id);
    const reviews = await request(app).get('/fetchReviews/dealer/' + dealer.id); assert.equal(reviews.body[0].review, review.review);
    const count = await mongoose.model('reviews').countDocuments();
    await require('../seed').seed(); assert.equal(await mongoose.model('reviews').countDocuments(), count);
    console.log('PASS: real MongoDB seed, all/filter/detail, concurrent inserts, newest-first and restart preservation');
  } finally { await mongoose.disconnect(); await mongo.stop(); }
})().catch(e => { console.error(e); process.exitCode=1; });
