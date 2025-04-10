import { useState, useEffect } from "react";
import BlockchainService from "./../services/eth_Service";
import EncryptedIPFSUploader from "./../IpfsUpload";
import FileUpload from "../IpfsUpload";
const Head = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleGetStarted = async () => {
    setIsLoading(true);
    const connected = await BlockchainService.connectWallet();
    if (connected) {
      setAccount(BlockchainService.account);
      try {
        const file = await BlockchainService.getAllFiles();
        if (file) {
          setUploadedFiles(file);
        } else {
          console.log("No files found on the blockchain");
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    }
    setIsConnected(connected);
    setIsLoading(false);
  };

  const handleDisconnect = () => {
    BlockchainService.account = null;
    BlockchainService.initialized = false;
    setAccount("");
    setIsConnected(false);
    setUploadedFiles([]);
  };

  useEffect(() => {
    const setupListeners = () => {
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });
      }
    };

    const handleAccountsChanged = async (newAccounts) => {
      if (newAccounts.length > 0) {
        await BlockchainService.refreshAccount();
        setAccount(newAccounts[0]);
        setIsConnected(true);
        const file = await BlockchainService.getAllFiles();
        try {
          const files = await BlockchainService.getAllFiles();
          if (files) {
            setUploadedFiles(files);
          } else {
            setUploadedFiles([]);
          }
        } catch (error) {
          console.error("Error fetching files after account change:", error);
          setUploadedFiles([]);
        }
      } else {
        handleDisconnect();
      }
    };
    setupListeners();
    setIsLoading(false);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", () =>
          window.location.reload()
        );
      }
    };
  }, []);

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-900 to-indigo-500 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg transition-all duration-300 group-hover:rotate-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 group-hover:scale-110 transition-transform"
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2" />
                <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
                <circle cx="12" cy="14" r="2" />
                <path d="M12 12v-2M12 16v2M14 14h2M10 14H8" />
              </svg>
            </span>
            <div className="absolute inset-0 rounded-full bg-blue-400 blur-xl opacity-20 -z-10"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent drop-shadow-sm">
              CipherShare
            </h1>
            <span className="text-xs text-blue-200 font-light tracking-wider">
              SECURE · DECENTRALIZED · MODERN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center">
              <div className="hidden md:flex items-center mr-2 bg-blue-800/40 px-3 py-1.5 rounded-lg border border-blue-700/50">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                <span className="text-sm text-blue-100">
                  {account
                    ? `${account.substring(0, 6)}...${account.substring(
                        account.length - 4
                      )}`
                    : "Not Connected"}
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="bg-blue-700/60 hover:bg-blue-600/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-blue-600/50 hover:border-blue-500"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 rounded-lg font-medium text-white shadow-lg hover:shadow-blue-500/30 transition duration-300"
            >
              <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Connect Wallet</span>
                </div>
              )}
            </button>
          )}
        </div>
      </header>
      <FileUpload files={uploadedFiles} />
    </>
  );
};

export default Head;
