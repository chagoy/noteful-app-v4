const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function() {
    const username = 'exampleUser';
    const password = 'examplePass';
    const fullname = 'example user';

    before(function() {
        return mongoose.connect(TEST_MONGODB_URI)
            .then(() => mongoose.connection.db.dropDatabase());
    });

    beforeEach(function() {
        return User.createIndexes();
    });

    afterEach(function() {
        return mongoose.connection.db.dropDatabase();
    });

    after(function() {
        return mongoose.disconnect();
    });

    describe('/api/users', function() {
        describe('posting', function() {
            it('should create a new user', function() {
                const testUser = { username, password, fullname };
                let res; 

                return chai
                    .request(app)
                    .post('/api/users')
                    .send(testUser)
                    .then(_res => {
                        res = _res;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.keys('id', 'username', 'fullname', 'createdAt', 'updatedAt');
                        expect(res.body.id).to.exist;
                        expect(res.body.username).to.equal(testUser.username);
                        expect(res.body.fullname).to.equal(testUser.fullname);

                        return User.findOne({ username });
                    })
                    .then(user => {
                        expect(user).to.exist;
                        expect(user.id).to.equal(res.body.id);
                        expect(user.fullname).to.equal(res.body.fullname);
                        expect(user.username).to.equal(res.body.username);
                        return user.validatePassword(password);
                    })
                    .then(isValid => {
                        expect(isValid).to.be.true;
                    });
            });

            it('should reject users with the missing username', function() {
                const testUser = { password, fullname };
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        });
            });

            it('should reject users with a missing password', function() {
                const testUser = { username, fullname };
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        });
            })

            it('should reject uses with a non-string username', function() {
                const testUser = { username: {}, fullname, password };
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        });
            });

            it('should reject useres with a non-string password', function() {
                const testUser = { username, fullname, password: []};
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        });
            });

            it('should reject users with a non-trimmed username', function() {
                const testUser = { username: 'billy   ', password, fullname };
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        });
            });

            it('should reject users with a non-trimmed password', function() {
                const testUser = { username, fullname, password: ' laskdf  '};
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        })
            });

            it('should reject users with empty username', function() {
                const testUser = { username: '', fullname, password };
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        });
            });

            it('should rejects users with a password less than 8 characters', function() {
                const testUser = { username, fullname, password: '123'};
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        })
            });

            it('should reject a user with password greater than 72 characters', function() {
                const testUser = { username, fullname, password: '111111192947294792479249247294792494095872904579208475927549082754908275498027549082759802734598027459027459827598027459802745982795427509424750923847592835472904572980345729804579280579827509824759802374598023475908234759082475849205478297540923875029347580925702'};
                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(422);
                        })
            });

            it('should reject users with duplicate username', function() {
                const testUser = { username, fullname, password };

                return chai.request(app)
                        .post('/api/users')
                        .send(testUser)
                        .then(res => {
                            expect(res).to.have.status(201);
                        })
                        .then(() => {
                            return chai.request(app)
                                .post('/api/users')
                                .send(testUser)
                                .then(res => {
                                    expect(res).to.have.status(400);
                                    expect(res.body.message).to.equal('The username already exists');
                                });
                        });
            });

            it('should trim fullname', function() {
                return chai.request(app)
                    .post('/api/users')
                    .send({ username, password, fullname: ` ${fullname} `})
                    .then(res => {
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.keys('id', 'username', 'fullname', 'createdAt', 'updatedAt');
                        expect(res.body.fullname).to.equal(fullname);
                        return User.findOne({ username });
                    })
                    .then(user => {
                        expect(user).to.not.be.null;
                        expect(user.fullname).to.equal(fullname);
                    })
            })
        });
    });
});