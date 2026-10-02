const Dealerships = require('./dealership');
const Reviews = require('./review');
const dealers = require('./data/dealerships.json').dealerships;
const reviews = require('./data/reviews.json').reviews;
async function seed() {
  // Idempotent seeding preserves all newly submitted reviews on restart.
  await Dealerships.bulkWrite(dealers.map(dealer => ({ updateOne: {
    filter: { id: dealer.id }, update: { $setOnInsert: dealer }, upsert: true } })));
  await Reviews.bulkWrite(reviews.map(review => ({ updateOne: {
    filter: { id: review.id }, update: { $setOnInsert: { ...review, time: new Date('2023-01-01') } }, upsert: true } })));
}
module.exports = { seed };
