# PiTokenFabric for Pi Network - Node.JS server-side package


This is a Pi Network Node.js npm package you can use to create token on the Pi Network with a node.js backend application.


## Install


Install this package as a dependency of your app:


```shell

# With npm:

npm install --save pi-token-fabric@1.0.0-beta.3

# With yarn:

yarn add pi-token-fabric@1.0.0-beta.3

```


## Example


1. Initialize the SDK

```javascript

import PiTokenFabric from 'pi-token-fabric';

const passphrase = "Pi Testnet"//"Pi Network" for mainnet
const assetName = "00PIKET"
const amount = 8000
const limit = 80000
// DO NOT expose these values to public
// Example secrets (you should securely generate / store these)
const issuerSecret = "S_YOUR_ISSUER_WALLET_PRIVATE_SEED";// starts with S
const distributorSecret = "S_YOUR_DISTRIBUTOR_WALLET_PRIVATE_SEED";// starts with S

const tokenFabricator = new PiTokenFabric(assetName, amount, limit, issuerSecret, distributorSecret, passphrase)

```


2. Create a token

```javascript

// Create the token
tokenFabricator.createToken()

```
