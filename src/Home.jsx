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
import { useStateContext } from "./DateTimeContext";

function Home() {
  const { votingStartTime, votingEndTime } = useStateContext();
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [remainingTime, setremainingTime] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [number, setNumber] = useState("");
  const [CanVote, setCanVote] = useState(true);

  const [startTime, setStartTime] = useState(null); // State variable to store start time
  const [endTime, setEndTime] = useState(null);
  const [candidateVoters, setCandidateVoters] = useState([]);

  useEffect(() => {
    getCandidates();
    getRemainingTime();
    getCurrentStatus();
    fetchVotingTimes();
    getVotersPerCandidate();
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

  async function fetchVotingTimes() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        provider
      );
      const start = await contractInstance.votingStart();
      const end = await contractInstance.votingEnd();
      const startTimestamp = parseInt(start._hex, 16) * 1000; // Convert seconds to milliseconds
      const endTimestamp = parseInt(end._hex, 16) * 1000; // Convert seconds to milliseconds
      setStartTime(new Date(startTimestamp));
      setEndTime(new Date(endTimestamp));
    } catch (error) {
      console.error("Error fetching voting times:", error);
    }
  }

  async function vote() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );

      // Proceed with the voting transaction if the user has not already voted
      const tx = await contractInstance.vote(number);
      await tx.wait();
    } catch (error) {
      alert("Already Voted, A user can only vote once");
      console.error(error);
    }
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

  async function getVotersPerCandidate() {
    try {
      // Connect to Ethereum provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Request access to user's accounts
      await provider.send("eth_requestAccounts", []);

      // Get the signer
      const signer = provider.getSigner();

      // Load the contract instance
      const contractInstance = new ethers.Contract(
        contractAddress,
        [
          "function getVotersAddress() view returns (tuple(uint256 name, address votersAddress)[])",
        ],
        signer
      );

      // Fetch the list of candidates with their voters
      const candidateVotersList = await contractInstance.getVotersAddress();

      // Format candidate voters data
      const formattedCandidateVoters = candidateVotersList.map(
        (candidateVoter) => {
          return {
            candidateIndex: candidateVoter.name,
            voterAddress: candidateVoter.votersAddress,
          };
        }
      );

      // Set the candidate voters state
      setCandidateVoters(formattedCandidateVoters);
      console.log(candidateVoters);
    } catch (error) {
      console.error("Error fetching candidate voters:", error);
    }
  }

  async function getCandidates() {
    try {
      // Connect to Ethereum provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Request access to user's accounts
      await provider.send("eth_requestAccounts", []);

      // Get the signer
      const signer = provider.getSigner();

      // Load the contract instance
      const contractInstance = new ethers.Contract(
        contractAddress,
        [
          "function getAllVotesOfCandidates() view returns (tuple(string name, uint256 voteCount)[])",
        ],
        signer
      );

      // Fetch the list of candidates
      const candidatesList = await contractInstance.getAllVotesOfCandidates();

      // Format candidates data
      const formattedCandidates = candidatesList.map((candidate, index) => {
        return {
          index: index,
          name: candidate.name,
          voteCount: candidate.voteCount.toNumber(),
        };
      });

      // Set the candidates state
      setCandidates(formattedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  }

  async function getCurrentStatus() {
    if (!startTime || !endTime) {
      // Start time or end time is not set, set voting status to false
      setVotingStatus(false);
      return;
    }

    // Get the current time
    const currentTime = new Date();

    // Check if the current time is between start time and end time
    if (currentTime >= votingStartTime && currentTime < votingEndTime) {
      // Current time is between start time and end time
      setVotingStatus(true);
    } else {
      // Current time is outside the voting period
      setVotingStatus(false);
    }
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
    <div className="">
      {isConnected ? (
        <Connected
          account={account}
          candidates={candidates}
          remainingTime={remainingTime}
          number={number}
          handleNumberChange={handleNumberChange}
          voteFunction={vote}
          showButton={CanVote}
          candidateVoters={candidateVoters}
        />
      ) : (
        <div className="login-container">
          <h1 className="welcome-message">
            Welcome to decentralized voting application
          </h1>

          {/* <ConnectWallet className="login-button" onConnect={connectToMetamask}> */}
          <Login connectWallet={connectToMetamask} />
          {/* </ConnectWallet> */}
        </div>
      )}
    </div>
  );
}

export default Home;
