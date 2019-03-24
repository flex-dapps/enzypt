'use strict';

const MongoClient = require('mongodb').MongoClient
const chai = require('chai');
const expect = require('chai').expect;

chai.use(require('chai-http'));
chai.use(require('chai-as-promised'));

// Start enzypt main
app = require('../server.js')

let dbConnection

// seller endpoints
describe('API endpoint /sell', function() {

  before(done => {
    // drop the db
    app.connectAndStart(process.env.MONGODB_TEST_URL, async () => {
      dbConnection = await MongoClient.connect(process.env.MONGODB_TEST_URL)
      dbConnection.dropDatabase(() => {
        done()
      })
    })
  })

  after(function(done) {
    app.server.close(done)
  });

  // POST - Add new file
  it('should return a new url slug and add file data to db', function() {

    var zipFileHash = '11'
    var metaFileHash = '22'
    var iv = '12212'
    var ethPrice = '1.0'

    return chai.request(app)
      .post('/sell')
      .send({
        'zipFileHash': zipFileHash,
        'metaFileHash': metaFileHash,
        'iv': iv,
        'ethPrice': ethPrice
      })
      .then(async (res) => {
        expect(res).to.have.status(201)
        expect(res).to.have.property('text')
        // Look up slug in db and compare
        var dbEntry = dbConnection.collection("sales").findOne({ 'urlSlug': res.text }, function(err, result) {
          expect(result.zipFileHash).to.equal(zipFileHash)
          expect(result.metaFileHash).to.equal(metaFileHash)
          expect(result.iv).to.equal(iv)
          expect(result.ethPrice).to.equal(ethPrice)
        });
    });
  });

  // POST - Incomplete post request
  it('Sending a request without zip file hash should fail with a 400', function() {

    var metaFileHash = '22'
    var iv = '12212'
    var ethPrice = '1.0'

    return chai.request(app)
      .post('/sell')
      .send({
        'metaFileHash': metaFileHash,
        'iv': iv,
        'ethPrice': ethPrice
      })
      .then(async (res) => {
        expect(res).to.have.status(400)
    });
  });

  // POST - Incomplete post request
  it('Sending a request without meta file hash should fail with a 400', function() {

    var zipFileHash = '11'
    var iv = '12212'
    var ethPrice = '1.0'

    return chai.request(app)
      .post('/sell')
      .send({
        'zipFileHash': zipFileHash,
        'iv': iv,
        'ethPrice': ethPrice
      })
      .then(async (res) => {
        expect(res).to.have.status(400)
    });
  });

  // POST - Incomplete post request
  it('Sending a request without initialization vector should fail with a 400', function() {

    var zipFileHash = '11'
    var metaFileHash = '22'
    var ethPrice = '1.0'

    return chai.request(app)
      .post('/sell')
      .send({
        'zipFileHash': zipFileHash,
        'metaFileHash': metaFileHash,
        'ethPrice': ethPrice
      })
      .then(async (res) => {
        expect(res).to.have.status(400)
    });
  });

  // POST - Incomplete post request
  it('Sending a request without price should fail with a 400', function() {

    var zipFileHash = '11'
    var metaFileHash = '22'
    var iv = '12212'

    return chai.request(app)
      .post('/sell')
      .send({
        'zipFileHash': zipFileHash,
        'metaFileHash': metaFileHash,
        'iv': iv
      })
      .then(async (res) => {
        expect(res).to.have.status(400)
    });
  });
});


describe('API endpoint /buy', function() {

  before(done => {
    // drop the db
    app.connectAndStart(process.env.MONGODB_TEST_URL, async () => {
      dbConnection = await MongoClient.connect(process.env.MONGODB_TEST_URL)
      dbConnection.dropDatabase(() => {
        done()
      })
    })
  })

  after(function(done) {
    app.server.close(done)
  });

  // GET - Show details of a file on sale
  it('Post and get details of a file for sale', function() {
    var zipFileHash = 'abcdef'
    var metaFileHash = 'fedcba'
    var iv = '101010101010101'
    var ethPrice = '0.1'

    // Post a file to retrieve later
    chai.request(app)
      .post('/sell')
      .send({
        'zipFileHash': zipFileHash,
        'metaFileHash': metaFileHash,
        'iv': iv,
        'ethPrice': ethPrice
      })
      .then(async (res) => {
        // Request file and compare
        return chai.request(app)
          .get('/' + res.text)
          .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body.metaFileHash).to.equal(metaFileHash)
            expect(res.body.iv).to.equal(iv)
            expect(res.body).to.have.property('downloads')
          });
    });
  });

  // GET - Request nonexisting file
  it('Buy request with invalid url slug should return 404', function() {

    return chai.request(app)
      .get('/XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAe') // Too short
      .then(function(res) {
        expect(res).to.have.status(404);
      });
  });

  // POST - Request for a random key
  it('/rand should return a random string', function() {
    return chai.request(app)
      .post('/rand')
      .send({
        publicKey: '0xBBB8C3f8997F9c0598Bd9DB897374879122E1d62'
      })
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.html;
        expect(res).to.have.property('text')
        expect(res.text).to.have.length(16)
      });
  });

  // POST - Request for a random key
  it('/rand with invalid address should return a 400', function() {
    return chai.request(app)
      .post('/rand')
      .send({
        publicKey: 'feckoff'
      })
      .then(function(res) {
        expect(res).to.have.status(400);
      });
  });

  // Signing message for a non-existing file
  it('A signed message for an unknown file should return 404', function() {
    return chai.request(app)
      .post('/msg')
      .send({
        publicKey: '123456',
        urlSlug: 'abcdef',
        signedMessage: 'somethinggood'
      })
      .then(function(res) {
        expect(res).to.have.status(404);
      });
  });

  // Missing message
  it('A missing signed message should return 400', function() {
    return chai.request(app)
      .post('/msg')
      .send({
        publicKey: '123456',
        urlSlug: 'abcdef'
      })
      .then(function(res) {
        expect(res).to.have.status(400);
      });
  });

  // Purchase without transaction hash
  it('A buy transaction without hash should return 400', function() {
    return chai.request(app)
      .post('/buy')
      .send()
      .then(function(res) {
        expect(res).to.have.status(400);
      });
  });

  // A transaction with wrong transaction hash
  it('A transaction with wrong transaction hash should return 418', function() {
    return chai.request(app)
      .post('/buy')
      .send({
        txHash: '0x77da5ded47b414646867f75d4c92d086fb329e02d32a78756db06fec17f70676'
      })
      .then(function(res) {
        expect(res).to.have.status(418);
      });
  });

  // A transaction with bad transaction hash
  it('A transaction with bad transaction hash should throw with UnhandledPromiseRejectionWarning', function() {
    expect(chai.request(app)
      .post('/buy')
      .send({
        txHash: '0xdeadbeef'
      })).to.throw
  });

  // POST - Wrong transaction hash
  it('A wrong transaction should return 418', function() {
    return chai.request(app)
      .post('/buy')
      .send({
        txHash: '0x552ee8b23b0306c11562886debb11122261f2030e23f7c553b2403fc1b68ed2c'
      })
      .then(function(res) {
        expect(res).to.have.status(418);
      });
  });
});

