import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractAbi, contractAddress } from "./Constant/constant";
import Login from "./Components/Login";
import Finished from "./Components/Finished";
import Connected from "./Components/Connected";
import "./App.css";

import {
  ConnectWallet,
  useAddress,
  useClaimToken,
  useTokenBalance,
  useTokenDrop,
  useTokenSupply,
} from "@thirdweb-dev/react";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [remainingTime, setremainingTime] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [number, setNumber] = useState("");
  const [CanVote, setCanVote] = useState(true);

  const [amount, setAmount] = useState(null);
  const address = useAddress();
  const tokenDrop = useTokenDrop("0x055560F27F017ffbe774D594D7A201038A295879");
  const { data: tokenSupply } = useTokenSupply(tokenDrop);
  const { data: tokenBalance } = useTokenBalance(tokenDrop, address);
  const { mutate: claimTokens, isLoading } = useClaimToken(tokenDrop);

  useEffect(() => {
    getCandidates();
    getRemainingTime();
    getCurrentStatus();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  });

  async function vote() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );

    const tx = await contractInstance.vote(number);
    await tx.wait();
    canVote();
  }

  async function canVote() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const voteStatus = await contractInstance.voters(await signer.getAddress());
    setCanVote(voteStatus);
  }

  async function getCandidates() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const candidatesList = await contractInstance.getAllVotesOfCandiates();
    const formattedCandidates = candidatesList.map((candidate, index) => {
      return {
        index: index,
        name: candidate.name,
        voteCount: candidate.voteCount.toNumber(),
      };
    });
    setCandidates(formattedCandidates);
  }

  async function getCurrentStatus() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const status = await contractInstance.getVotingStatus();
    console.log(status);
    setVotingStatus(status);
  }

  async function getRemainingTime() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const time = await contractInstance.getRemainingTime();
    setremainingTime(parseInt(time, 16));
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length > 0 && account !== accounts[0]) {
      setAccount(accounts[0]);
      canVote();
    } else {
      setIsConnected(false);
      setAccount(null);
    }
  }

  async function connectToMetamask() {
    // Function to connect to Metamask wallet
    console.log("ayusha");
    if (window.ethereum) {
      // Check if Metamask is installed
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum); // Create Ethereum provider using Metamask
        await provider.send("eth_requestAccounts", []); // Request user's Ethereum accounts
        const signer = provider.getSigner(); // Get signer from provider
        const address = await signer.getAddress(); // Get user's Ethereum address
        setAccount(address); // Set user's Ethereum address to state
        console.log("Metamask Connected: " + address); // Log successful connection
        setIsConnected(true); // Update wallet connection status
        canVote(); // Check if user can vote after connection
      } catch (err) {
        console.error(err); // Log and handle connection error
      }
    } else {
      console.error("Metamask is not detected in the browser"); // Log if Metamask is not detected
    }
  }

  async function handleNumberChange(e) {
    setNumber(e.target.value);
  }

  return (
    <div className="App">
      {votingStatus ? (
        isConnected ? (
          <Connected
            account={account}
            candidates={candidates}
            remainingTime={remainingTime}
            number={number}
            handleNumberChange={handleNumberChange}
            voteFunction={vote}
            showButton={CanVote}
          />
        ) : (
          <div className="login-container">
            <h1 className="welcome-message">
              Welcome to decentralized voting application
            </h1>

            <ConnectWallet
              className="login-button"
              onConnect={connectToMetamask}
            >
              <Login connectWallet={connectToMetamask} />
            </ConnectWallet>
          </div>
        )
      ) : (
        <Finished />
      )}
    </div>
  );
}

export default App;
