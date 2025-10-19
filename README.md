# PiTokenFabric for Pi Network - Node.JS server-side package


This is a Pi Network Node.js npm package you can use to create token on the Pi Network with a node.js backend application.

Note: It is just for test and to be familiarized with token creation and how it works.

## Install


Install this package as a dependency of your app:


```shell

# With npm:

npm install --save pi-token-fabric

# With yarn:

yarn add pi-token-fabric

```


## Example


1. Initialize the SDK

```javascript

import PiTokenFabric from 'pi-token-fabric';

const passphrase = "Pi Testnet"//"Pi Network" for mainnet
const assetName = "YourAssetCode"
const amount = 8000
const limit = 80000
// DO NOT expose these values to public
// Example secrets (you should securely generate / store these)
// Create an App wallet as issuer
const issuerSecret = "S_YOUR_ISSUER_WALLET_PRIVATE_SEED";// starts with S
//Create an App wallet as distributor
const distributorSecret = "S_YOUR_DISTRIBUTOR_WALLET_PRIVATE_SEED";// starts with S

const tokenFabricator = new PiTokenFabric(assetName, amount, limit, issuerSecret, distributorSecret, passphrase)

```


2. Create a token

```javascript

// Create the token
await tokenFabricator.createToken()

```

3. Information about the token created

```javascript

// Get info about the token
tokenFabricator.getInfo()

```
Note: refer to the dev console to see the information
