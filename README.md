# Enzypt.io

## Contents

- [Overview](#overview)
- [How does it work?](#how-does-it-work)
- [API Specification](#api-specification)
- [Development](#development)
- [Configuration](#configuration)

## Overview
This is the repository for the [enzypt.io](https://enzypt.io) backend which is hosted at api.enzypt.io. The "official" gateway is hosted by [Flex Dapps](https://flexdapps.com), however this code can be used to host your own payment verification gateway.

Crucially, regardless of whoever hosts the server, no server (running this code) can see what's in the files that are being sold through enzypt.

However, it should be noted that since the decryption key is passed around in the URL, it is possible for servers to retrieve this key in the event that you are hitting them (for example by navigating to a hosted frontend) instead of using _just_ the API.

Enzypt was made because we thought it was a neat idea, but we don't guarantee anything, this software is provided as-is blah blah blah.

## How Does it Work?
Enzypt.io hosts a frontend application, which is responsible for handling file zipping/encrypting/uploading. Once the files are uploaded, the enzypt backend API is responsible for verifying that a payment is correct. [ipfs.enzypt.io](https://ipfs.enzypt.io) is a publicly writable IPFS gateway (and we ask you to use it nicely).

In relatively broad strokes:

- Payload is zipped and encrypted
- Metadata is encrypted
- Payload and metadata are uploaded to separate IPFS locations using [ipfs.enzypt.io](https://ipfs.enzypt.io)
- Payload and metadata hashes are posted to the API
- Unique payment link is returned to the seller
- Seller shares the link with buyers
- Buyer loads the metadata file from /:urlSlug
- Buyer requests a random string to sign from /rand
- Buyer posts a signed message to /msg
- Buyer sends the transaction with the data equal to the return from /msg
- Buyer sends the transaction hash to /buy
- API returns the IPFS hash of the payload
- Buyer downloads and decrypts the payload

Make an issue for any questions.

## API Specification
All endpoints should be hit with a `"Content-Type": "application/json"` header.

### POST /sell

Hit this when we have encrypted and uploaded both the zip file and the meta file to IPFS, and we're ready to entrust an enzypt gateway to release the IPFS hash when someone pays for it.

Params

```
{
    zipFileHash: String, // IPFS hash of the zip file
    metaFileHash: String // IPFS hash of the meta file
    // @todo add the meta file format
}
```

Returns

```
String // The unique url slug for the file
```

### Buying a File

#### GET /:urlSlug

Get the metadata IPFS hash of a particular file for sale.

Returns

```
String // The IPFS hash of the metadata file
```

#### POST /rand

Get a random string to sign to prove that you own a public key.

Params

```
{
    publicKey: String // Public key that we're going to prove we own
}
```

Returns

```
String // Random 16 character alphanumeric string
```

#### POST /msg

Post a signed message to prove that we own a public key and that we want to purchase a particular file.

Params

```
{
    signedMessage: String,  // Message signature
    publicKey: String,      // Key which should be recovered from the signature
    urlSlug: String         // URL of the file which we're going to buy
}
```

Returns

```
String // Random 32 char hex string to add as data to payment transaction
```

#### POST /buy

Post a transaction hash to inform the server of a purchase and receive the IPFS file hash of that purchase.

Params

```
{
    txHash: String // Transaction hash of the payment transaction
}
```

Returns

```
String // IPFS hash of the purchased zip file
```

## Development

To set up Enzypt locally, you will need a `MongoDB` instance that you can connect to. Clone this repo, then run:

```
yarn
```

You'll then need to create a file called `.env`, inside which you should put the following:

```
MONGODB_URL=mongodb://localhost/enzypt
MONGODB_TEST_URL=mongodb://localhost/enzypttest # <-- Used for running tests
NETWORK=rinkeby # <-- Can be any key that you add in the `config/index.js` file under ETH_NODE_RPC_URL
PORT=3001 # <-- The port you would like the API to run on
```

Then you can start the backend with:

```
yarn start
```

## Configuration

The backend relies on INFURA as the web3 provider to verify purchases (transactions). To enable INFURA, you have to add your project ID to `config/index.js`. Alternatively, you can provide your own provider URL there.