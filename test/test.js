'use strict';

const MongoClient = require('mongodb').MongoClient
const chai = require('chai');
const expect = require('chai').expect;
var assert = require('assert');
const web3 = require('../services/web3')

chai.use(require('chai-http'));

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
        expect(res).to.be.json
        expect(res.body).to.have.property('slug')

        // Look up slug in db and compare
        var dbEntry = dbConnection.collection("sales").findOne({ 'urlSlug': res.body.slug }, function(err, result) {
          expect(result.zipFileHash).to.equal(zipFileHash)
          expect(result.metaFileHash).to.equal(metaFileHash)
          expect(result.iv).to.equal(iv)
          expect(result.ethPrice).to.equal(ethPrice)
        });
    });
  });
});


describe('API endpoint /buy', function() {

  before(function() {

  });

  after(function() {

  });

  // GET - Show details of a file on sale
  it('should return details of a file', function() {

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
          .get('/' + res.body.slug)
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
  it('should return 404', function() {

    return chai.request(app)
      .get('/XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAe') // Too short
      .then(function(res) {
        expect(res).to.have.status(404);
      });
  });
  
  // POST - Request for a random key
  it('should return a random string', function() {
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
  it('should return a 400', function() {
    return chai.request(app)
      .post('/rand')
      .send({
        publicKey: 'feckoff'
      })
      .then(function(res) {
        expect(res).to.have.status(400);
      });
  });

  /*
  // POST - Posting a signed message to verify address ownership
  it('should validate the signed message and public key', function() {
    return chai.request(app)
      .post('/msg')
      .send({
        publicKey: '0xbbb8c3f8997f9c0598bd9db897374879122e1d62',
        signedMessage: 'signedMessage',
        urlSlug: 'rrrandom'
      })
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.html;
        expect(res).to.have.property('text')
        expect(res.text).to.have.length(32)
      });
  });
  
  // POST - Bad message
  it('An unknown signed message should return 418', function() {
    return chai.request(app)
      .post('/msg')
      .send({
        publicKey: '123456',
        urlSlug: 'abcdef',
        signedMessage: 'somethinggood'
      })
      .then(function(res) {
        console.log(res.body)
        expect(res).to.have.status(418);
      });
  });

  // POST - Bad transaction
  it('A bad transaction should return 400', function() {
    return chai.request(app)
      .post('/buy')
      .send({
        txHash: '0xdeadbeef'
      })
      .then(function(res) {
        expect(res).to.have.status(400);
      });
  });

  */

  // POST - Missing message
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

  // POST - Bad transaction
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

