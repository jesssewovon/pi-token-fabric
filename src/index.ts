import * as StellarSdk from "@stellar/stellar-sdk";
import { Keypair, TransactionBuilder, Operation, Asset, Networks } from "@stellar/stellar-sdk";
import { NetworkPassphrase} from "./types";

export default class PiTokenFabric {
  private networkPassphrase: NetworkPassphrase;
  private issuerKeypair: StellarSdk.Keypair;
  private distributorKeypair: StellarSdk.Keypair;

  constructor(networkPassphrase: NetworkPassphrase, issuerWalletPrivateSeed: string, distrinutorWalletPrivateSeed: string) {
    this.validateSeedFormat(issuerWalletPrivateSeed);
    this.validateSeedFormat(distrinutorWalletPrivateSeed);

    this.networkPassphrase = networkPassphrase;
    this.issuerKeypair = StellarSdk.Keypair.fromSecret(issuerWalletPrivateSeed);
    this.distributorKeypair = StellarSdk.Keypair.fromSecret(distrinutorWalletPrivateSeed);
  }

  public createToken = async() => {
    const server = this.getHorizonClient(this.networkPassphrase)
    // 1. Distributor trusts the asset
    const distributorAccount = await server.loadAccount(this.distributorKeypair.publicKey());
    const baseFee = await server.fetchBaseFee();
  
    const token = new Asset("PIKET", this.issuerKeypair.publicKey());
  
    const trustTx = new TransactionBuilder(distributorAccount, {
      fee: baseFee.toString(),
      networkPassphrase: this.networkPassphrase
    })
    .addOperation(Operation.changeTrust({
      asset: token
    }))
    .setTimeout(100)
    .build();
  
    trustTx.sign(this.distributorKeypair);
    await server.submitTransaction(trustTx);
    console.log("Distributor trusts the token on Pi");
  
    // 2. Issuer issues (sends) tokens to distributor
    const issuerAccount = await server.loadAccount(this.issuerKeypair.publicKey());
    const issueTx = new TransactionBuilder(issuerAccount, {
      fee: baseFee.toString(),
      networkPassphrase: this.networkPassphrase
    })
    .addOperation(Operation.payment({
      destination: this.distributorKeypair.publicKey(),
      asset: token,
      amount: "1000000"
    }))
    .setTimeout(100)
    .build();
  
    issueTx.sign(this.issuerKeypair);
    const resp = await server.submitTransaction(issueTx);
    console.log("Issued token to distributor:", resp);
  }

  private validateSeedFormat = (seed: unknown) => {
    if (!seed) throw new Error("missing_wallet_private_seed");
    if (typeof seed !== "string") throw new Error("wallet_private_seed_not_string");
    if (!seed.startsWith("S")) throw new Error("wallet_private_seed_not_starts_with_S");
    if (seed.length !== 56) throw new Error("wallet_private_seed_not_56_chars_long");
    if (!StellarSdk.StrKey.isValidEd25519SecretSeed(seed)) throw new Error("invalid_wallet_private_seed");
  };

  private isMainnet = (passphrase: NetworkPassphrase) => {
    return passphrase === 'Pi Network';
  };

  private getHorizonClient = (network: NetworkPassphrase) => {
    const serverUrl = this.isMainnet(network)
      ? 'https://api.mainnet.minepi.com'
      : 'https://api.testnet.minepi.com';
    return new StellarSdk.Horizon.Server(serverUrl);
  };
}

//export { PiPaymentError };