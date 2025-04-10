import { useState, useEffect } from "react";
import { ethers } from "ethers";

function Header() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);

          // Get signer and contract instance
          const signer = await provider.getSigner();
          const contractAddress = "0xe281613A28Fa308D691890490843c46B611F7155"; // Replace with your contract address
          const contract = new ethers.Contract(
            contractAddress,
            DStore.abi,
            signer
          );
          setContract(contract);

          // Get user role
          const role = await contract.getUserRole();
          setUserRole(Number(role));
        }
      } else {
        console.error("Metamask is not installed");
        alert("Please install MetaMask to use this application");
      }
    } catch (err) {
      console.error("Error connecting to wallet:", err);
    } finally {
      setIsLoading(false);
    }
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
        setAccount(newAccounts[0]);
        setIsConnected(true);
        // await fetchUserFiles(newAccounts[0]);
      } else {
        setAccount("");
        setIsConnected(false);
      }
    };

    // const fetchUserFiles = async (userAccount) => {
    //   if (!contract) return;
    //   try {
    //     const files = await contract.getUserFiles(userAccount);
    //     setUserFiles(files); // Update the state with user files
    //   } catch (error) {
    //     console.error("Error fetching user files:", error);
    //   }
    // };
    setupListeners();
    setIsLoading(false);

    // Cleanup event listeners when component unmounts
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
  }, [contract]);

  const handleGetStarted = async () => {
    await connectWallet();
  };

  const handleDisconnect = () => {
    setAccount("");
    setIsConnected(false);
  };

  return (
    <>
      {isConnected ? (
        <div className="flex items-center gap-4">
          <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
            Welcome Back
          </span>
          <span className="hidden md:inline text-sm">
            {account
              ? `${account.substring(0, 6)}...${account.substring(
                  account.length - 4
                )}`
              : "Not Connected"}
          </span>
          <button
            onClick={handleDisconnect}
            className="bg-white text-blue-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-100"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleGetStarted}
          disabled={isLoading}
          className="bg-white text-blue-800 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition duration-300"
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </>
  );
}

export default Header;
