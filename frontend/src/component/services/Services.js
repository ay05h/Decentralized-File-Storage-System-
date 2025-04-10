import Web3 from "web3";
import DStore from "./../../contracts/DStore.json"; // You'll need to export the ABI

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.contractAddress = "0x..."; // Replace with your deployed contract address
  }

  // Initialize web3 and connect to MetaMask
  async initialize() {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // Create Web3 instance
        this.web3 = new Web3(window.ethereum);

        // Get connected account
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];

        // Initialize contract
        this.contract = new this.web3.eth.Contract(
          DStore.abi,
          this.contractAddress
        );

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts) => {
          this.account = accounts[0];
        });

        return true;
      } catch (error) {
        console.error("User denied account access", error);
        return false;
      }
    } else {
      console.error("No Ethereum browser extension detected");
      return false;
    }
  }

  // Add file metadata to blockchain
  async addFile(fileName, ipfsHash, encryptionKey) {
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    // Note: In a production app, encrypt the key client-side before sending to blockchain
    // This is just storing the key - in production you'd encrypt it first with the user's public key
    try {
      const result = await this.contract.methods
        .addFile(fileName, ipfsHash, encryptionKey)
        .send({ from: this.account });

      return result;
    } catch (error) {
      console.error("Error adding file to blockchain:", error);
      throw error;
    }
  }

  // Get all files for the current user
  async getAllFiles() {
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const result = await this.contract.methods
        .getAllFiles()
        .call({ from: this.account });

      // Format the result into an array of file objects
      const { fileNames, ipfsHashes, encryptionKeys, timestamps, statuses } =
        result;

      const files = [];
      for (let i = 0; i < fileNames.length; i++) {
        if (statuses[i]) {
          // Only include active files
          files.push({
            fileName: fileNames[i],
            ipfsHash: ipfsHashes[i],
            encryptionKey: encryptionKeys[i],
            timestamp: new Date(timestamps[i] * 1000).toLocaleString(),
            isActive: statuses[i],
          });
        }
      }

      return files;
    } catch (error) {
      console.error("Error getting files from blockchain:", error);
      throw error;
    }
  }

  // Remove file (soft delete)
  async removeFile(index) {
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const result = await this.contract.methods
        .removeFile(index)
        .send({ from: this.account });

      return result;
    } catch (error) {
      console.error("Error removing file:", error);
      throw error;
    }
  }

  // Update encryption key
  async updateEncryptionKey(index, newKey) {
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const result = await this.contract.methods
        .updateEncryptionKey(index, newKey)
        .send({ from: this.account });

      return result;
    } catch (error) {
      console.error("Error updating encryption key:", error);
      throw error;
    }
  }

  // Get file count
  async getFileCount() {
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const count = await this.contract.methods
        .getFileCount()
        .call({ from: this.account });
      return parseInt(count);
    } catch (error) {
      console.error("Error getting file count:", error);
      throw error;
    }
  }
}

export default new BlockchainService();
