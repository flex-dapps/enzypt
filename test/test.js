'use strict';

const MongoClient = require('mongodb').MongoClient
const chai = require('chai');
const expect = require('chai').expect;
var assert = require('assert');

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
          .get('/' + res.slug)
          .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.zipFileHash).to.equal(zipFileHash)
            expect(res.metaFileHash).to.equal(metaFileHash)
            expect(res.iv).to.equal(iv)
            expect(res.ethPrice).to.equal(ethPrice)
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
  
  /*

  // GET - Invalid path/urlslug
  it('should return 404', function() {
    return chai.request(app)
      .get('/INVALID_PATH')
      .then(function(res) {
        console.log(res)
        throw new Error('Path exists!');
      })
      .catch(function(err) {
        expect(err).to.have.status(404);
      });
  });

  // GET - Invalid file
  it('should say that this file is not for sale', function() {
    return chai.request(app)
      .get('/buy')
      .then(function(res) {
        throw new Error('File exists!');
      })
      .catch(function(err) {
        expect(err).to.have.status(404);
      });
  });

  // POST - Request for a random key
  it('should return a random string', function() {
    return chai.request(app)
      .post('/rand')
      .send({
        publicKey: '...'
      })
      .then(function(res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body.results).to.be.an('array').that.includes(
          'randomString');
      });
  });

  // POST - Posting a signed message to verify address ownership
  it('should add new color', function() {
    return chai.request(app)
      .post('/rand')
      .send({
        publicKey: '...'
      })
      .then(function(res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body.results).to.be.an('array').that.includes(
          'randomString');
      });
  });

  // POST - Bad Request
  it('should return Bad Request', function() {
    return chai.request(app)
      .post('/colors')
      .type('form')
      .send({
        color: 'YELLOW'
      })
      .then(function(res) {
        throw new Error('Invalid content type!');
      })
      .catch(function(err) {
        expect(err).to.have.status(400);
      });
  });

  */
});

