const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Protected endpoints', function () {
    let db;

    const {
        testThings,
        testUsers
    } = helpers.makeThingsFixtures();

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        });
        app.set('db', db);
    });

    after('disconnect from db', () => db.destroy());

    before('cleanup', () => helpers.cleanTables(db));

    afterEach('cleanup', () => helpers.cleanTables(db));

    describe('GET /api/things/:thing_id', () => {
        beforeEach('seed database', () => helpers.seedThingsTables(db, testUsers, testThings));
        it(`responds 401 'Missing bearer token' when no bearer token`, () => {
            const noUserNoPass = {user_name: '', password: ''};
            return supertest(app)
                .get('/api/things/1')
                .set('Authorization', helpers.makeAuthHeader(noUserNoPass))
                .expect(401, {error: "Unauthorized request"});
        });
        it('responds 401 \'Missing basic token\' when no user', () => {
            const noUser = {user_name: '', password: testUsers[0].password};
            return supertest(app)
                .get('/api/things/1')
                .set('Authorization', helpers.makeAuthHeader(noUser))
                .expect(401, {error: "Unauthorized request"});
        });
        it('responds 401 \'Missing basic token\' when no password', () => {
            return supertest(app)
                .get('/api/things/1')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0], 'secret'))
                .expect(401, {error: "Unauthorized request"});
        });
    });

    describe('POST /api/reviews', () => {
        beforeEach('seed database', () => helpers.seedThingsTables(db, testUsers, testThings));
        it('responds 401 \'Missing basic token\' when no token', () => {
            const noUserNoPass = {user_name: '', password: ''};
            return supertest(app)
                .post('/api/reviews')
                .set('Authorization', helpers.makeAuthHeader(noUserNoPass))
                .expect(401, {error: "Unauthorized request"});
        });
        it('responds 401 \'Missing basic token\' when no user', () => {
            const noUser = {user_name: '', password: testUsers[0].password};
            return supertest(app)
                .post('/api/reviews')
                .set('Authorization', helpers.makeAuthHeader(noUser))
                .expect(401, {error: "Unauthorized request"});
        });
        it('responds 401 \'Missing basic token\' when no password', () => {
            return supertest(app)
                .post('/api/reviews')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .expect(400);
        });
        it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
            const validUser = testUsers[0];
            const invalidSecret = 'bad-secret';
            return supertest(app)
                .get('/api/things/1')
                .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
                .expect(401, {error: `Unauthorized request`})
        })
    });
});