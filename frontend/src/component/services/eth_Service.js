import { ethers } from "ethers";
import DStore from "../../contracts/DStore.json";
import conf from "./../conf/conf";
class BlockchainService {
  constructor() {
    this.account = null;
    this.contract = null;
    this.provider = null;
    this.signer = null;
    this.contractAddress = conf.contract_address;
    this.initialized = false;
  }
  async initializeProvider() {
    if (window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      return true;
    }
    return false;
  }

  async connectWallet() {
    try {
      const hasProvider = await this.initializeProvider();

      if (hasProvider) {
        const accounts = await this.provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          this.account = accounts[0];
          await this.updateSigner();
          this.initialized = true;
          return true;
        }
      } else {
        console.error("Metamask is not installed");
        alert("Please install MetaMask to use this application");
        return false;
      }
    } catch (err) {
      console.error("Error connecting to wallet:", err);
      return false;
    }
  }

  async updateSigner() {
    if (!this.provider) {
      await this.initializeProvider();
    }

    try {
      this.signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(
        this.contractAddress,
        DStore.abi,
        this.signer
      );
      return true;
    } catch (error) {
      console.error("Error updating signer:", error);
      return false;
    }
  }

  async refreshAccount() {
    if (!this.provider) {
      await this.initializeProvider();
    }

    try {
      const accounts = await this.provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        // Check if account changed
        if (this.account !== accounts[0]) {
          this.account = accounts[0];
          await this.updateSigner();
        }
      } else {
        this.account = null;
        this.initialized = false;
      }
      return this.account;
    } catch (error) {
      console.error("Error refreshing account:", error);
      return null;
    }
  }

  async addFile(fileName, ipfsHash) {
    await this.refreshAccount();
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const tx = await this.contract.addFile(fileName, ipfsHash);
      const receipt = await tx.wait();
      console.log("File added to blockchain:", receipt);
      return receipt;
    } catch (error) {
      console.error("Error adding file to blockchain:", error);
      throw error;
    }
  }

  async getFileCount() {
    await this.refreshAccount();
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const fileCount = await this.contract.getFileCount();
      console.log("File count:", fileCount.toString()); // Convert BigNumber to string
      return fileCount;
    } catch (error) {
      console.error("Error fetching file count:", error);
      throw error;
    }
  }

  async getAllFiles() {
    await this.refreshAccount();
    if (!this.contract || !this.account) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const [fileNames, ipfsHashes, timestamps, statuses] =
        await this.contract.getAllFiles();

      const files = fileNames.map((name, index) => ({
        fileName: name,
        ipfsHash: ipfsHashes[index],
        timestamp: new Date(Number(timestamps[index]) * 1000).toLocaleString(),
        isEncrypted: statuses[index],
      }));

      return files;
    } catch (error) {
      console.error("Error getting files from blockchain:", error);
      throw error;
    }
  }
}

export default new BlockchainService();
