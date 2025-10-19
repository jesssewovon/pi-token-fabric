import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  Horizon,
  StrKey,
} from "@stellar/stellar-sdk";
import { NetworkPassphrase } from "./types/index.js";

export class PiTokenFabric {
  private assetName: string;
  private amount: number;
  private limit: number;
  private issuerKeypair: Keypair;
  private distributorKeypair: Keypair;
  private networkPassphrase: NetworkPassphrase;

  constructor(assetName: string, amount: number, limit: number, issuerWalletPrivateSeed: string, distrinutorWalletPrivateSeed: string, networkPassphrase: NetworkPassphrase) {
    if (amount>limit) throw new Error("Amount cannot be greater than the limit");
    
    this.validateSeedFormat(issuerWalletPrivateSeed);
    this.validateSeedFormat(distrinutorWalletPrivateSeed);

    this.assetName = assetName;
    this.limit = limit;
    this.amount = amount;
    this.issuerKeypair = Keypair.fromSecret(issuerWalletPrivateSeed);
    this.distributorKeypair = Keypair.fromSecret(distrinutorWalletPrivateSeed);
    this.networkPassphrase = networkPassphrase;
  }

  public createToken = async() => {
    const server = this.getHorizonClient(this.networkPassphrase)
    // 1. Distributor trusts the asset
    // create trustline on distributor
    const distributorAccount = await server.loadAccount(this.distributorKeypair.publicKey());
    const baseFee = await server.fetchBaseFee();
  
    const token = new Asset(this.assetName, this.issuerKeypair.publicKey());
  
    const trustTx = new TransactionBuilder(distributorAccount, {
      fee: baseFee.toString(),
      networkPassphrase: this.networkPassphrase
    })
    .addOperation(Operation.changeTrust({
      asset: token,
      limit: this.limit.toString(),// Token limit
    }))
    .setTimeout(100)
    .build();
  
    trustTx.sign(this.distributorKeypair);
    await server.submitTransaction(trustTx);
    console.log("Distributor trusts the token on Pi");
  
    // 2. Issuer issues (sends) tokens to distributor
    // Send tokens from issuer to distributor
    const issuerAccount = await server.loadAccount(this.issuerKeypair.publicKey());
    const issueTx = new TransactionBuilder(issuerAccount, {
      fee: baseFee.toString(),
      networkPassphrase: this.networkPassphrase
    })
    .addOperation(Operation.allowTrust({
      trustor: this.distributorKeypair.publicKey(),
      assetCode: this.assetName,
      authorize: true,
    }))
    .addOperation(Operation.payment({
      destination: this.distributorKeypair.publicKey(),
      asset: token,
      amount: this.amount.toString()//Initial supply (<= token limit)
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
    if (!StrKey.isValidEd25519SecretSeed(seed)) throw new Error("invalid_wallet_private_seed");
  };

  private isMainnet = (passphrase: NetworkPassphrase) => {
    return passphrase === 'Pi Network';
  };

  private getHorizonClient = (network: NetworkPassphrase) => {
    const serverUrl = this.isMainnet(network)
      ? 'https://api.mainnet.minepi.com'
      : 'https://api.testnet.minepi.com';
    return new Horizon.Server(serverUrl);
  };

  public getInfo = () => {
    console.log(`Token: ${this.assetName}`);
    console.log(`Issuer: ${this.issuerKeypair.publicKey()}`);
    console.log(`Distributor: ${this.distributorKeypair.publicKey()}`);
    console.log("Distributor balances info:");
    checkBalances(this.networkPassphrase, this.distributorKeypair.publicKey()).catch(err => {
      console.error("Error creating token on Pi:", err.response?.data || err.toString());
    });
  }
}

export const checkBalances = async (network, publicKey) => {
  const serverUrl = network==="pi Network"
      ? 'https://api.mainnet.minepi.com'
      : 'https://api.testnet.minepi.com';
  const server = new Horizon.Server(serverUrl);

  const account = await server.loadAccount(publicKey);
  console.log("Balances for account:", publicKey);

  account.balances.forEach((balance) => {
    if (balance.asset_type === "native") {
      const nativeSymbol = "Pi"
      console.log(`🔹 ${nativeSymbol} (native): ${balance.balance}`);
    } 
    else if ("asset_code" in balance && "asset_issuer" in balance) {
      console.log(
        `🔸 ${balance.asset_code}: ${balance.balance} (issuer: ${balance.asset_issuer})`
      );
    } 
    else if (balance.asset_type === "liquidity_pool_shares") {
      console.log(
        `💧 Liquidity Pool: ${balance.balance} shares (ID: ${balance.liquidity_pool_id})`
      );
    }
  });
}

export default PiTokenFabric;