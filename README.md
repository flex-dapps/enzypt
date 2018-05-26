# enzypt.io API Docs

Here lies the API spec for https://api.enzypt.io. All endpoints should be hit with a `"Content-Type": "application/json"` header.

## Selling a File

### POST /sell

Should hit this when we have encrypted and uploaded both the zip file and the meta file to IPFS, and we're ready to entrust enzypt to release the file hash when someone has paid for the file.

Params
```
{
    zipFileHash: String, // IPFS hash of the Zip file
    metaFileHash: String // IPFS hash of the meta file
}
```

Returns
```
String // The unique url slug for the file
```

## Buying a File

### GET /:urlSlug

Get the metadata file hash of a particular file for sale.

Returns
```
String // The IPFS hash of the metadata file
```

### POST /rand

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

### POST /msg

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

### POST /buy

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

