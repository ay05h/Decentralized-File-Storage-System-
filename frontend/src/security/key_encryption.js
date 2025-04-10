// src/security/key_encryption.js
import { ethers } from "ethers";

class KeyEncryptionService {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  async initializeProvider() {
    if (window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      return true;
    }
    return false;
  }

  // Get the public key from the current account
  async getPublicKey() {
    if (!this.signer) {
      await this.initializeProvider();
    }

    try {
      // Get the public key from the Ethereum account
      const address = await this.signer.getAddress();
      // This makes an RPC call to get the public key - note that not all wallets support this
      const publicKey = await this.provider.send("eth_getEncryptionPublicKey", [
        address,
      ]);
      return publicKey;
    } catch (error) {
      console.error("Error getting public key:", error);
      throw new Error(
        "Failed to get public key from wallet. Make sure your wallet supports eth_getEncryptionPublicKey."
      );
    }
  }

  // Encrypt the file encryption key with the user's public key
  async encryptKey(fileEncryptionKey, publicKey) {
    try {
      // Using the ethers utility for encryption (or could use web3.eth.encrypt in web3.js)
      // Convert input to proper format
      const encryptedKey = await window.ethereum.request({
        method: "eth_encrypt",
        params: [fileEncryptionKey, publicKey],
      });
      return encryptedKey;
    } catch (error) {
      console.error("Error encrypting key:", error);
      throw new Error("Failed to encrypt key with public key");
    }
  }

  // Decrypt the file encryption key with the user's private key
  async decryptKey(encryptedKey) {
    if (!this.signer) {
      await this.initializeProvider();
    }

    try {
      const address = await this.signer.getAddress();
      // Decrypt using the wallet's private key
      const decryptedKey = await window.ethereum.request({
        method: "eth_decrypt",
        params: [encryptedKey, address],
      });
      return decryptedKey;
    } catch (error) {
      console.error("Error decrypting key:", error);
      throw new Error(
        "Failed to decrypt key. Make sure you're using the correct Ethereum account."
      );
    }
  }
}

export default new KeyEncryptionService();
