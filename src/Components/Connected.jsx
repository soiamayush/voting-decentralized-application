import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  ConnectWallet,
  useAddress,
  useClaimToken,
  useTokenBalance,
  useTokenDrop,
  useTokenSupply,
} from "@thirdweb-dev/react";
import { useStateContext } from "../DateTimeContext";
import { Link } from "react-router-dom";

const Connected = (props) => {
  const [amount, setAmount] = useState(50); // Initialize amount state with 50
  const address = useAddress();
  const tokenDrop = useTokenDrop("0x055560F27F017ffbe774D594D7A201038A295879");
  const { data: tokenSupply } = useTokenSupply(tokenDrop);
  const { data: tokenBalance } = useTokenBalance(tokenDrop, address);
  const [signer, setSigner] = useState(null);
  const [claimBtn, setClaimBtn] = useState(props.showButton);
  const { votingStartTime, votingEndTime } = useStateContext(); // Retrieve voting start and end times from context
  const [remainingTime, setRemainingTime] = useState(null);
  const [claimed, setClaimed] = useState(false); // State to track if tokens are claimed
  const [winner, setWinner] = useState(null); // State to store the winner
  const [currentTime, setCurrentTime] = useState(new Date()); // Initialize currentTime with current time

  const getSigner = async () => {
    // Connect to the Ethereum provider (e.g., MetaMask)
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Ensure that the user is prompted to connect their wallet if not already connected
    await provider.send("eth_requestAccounts", []);

    // Get the signer from the provider
    setSigner(provider.getSigner());
  };
  const { mutate: claimTokens, isLoading } = useClaimToken(tokenDrop, signer);

  // Update amount and address state when props change
  useEffect(() => {
    setAmount(50); // Reset amount to default value
    getSigner();

    // Check if tokens are claimed from local storage
    const claimedTokens = localStorage.getItem("claimedTokens");
    if (claimedTokens) {
      setClaimed(true);
    }

    // Calculate remaining time if votingEndTime is available
    if (votingEndTime) {
      // Voting has ended
      if (currentTime > votingEndTime) {
        setRemainingTime(null); // No need to display remaining time
        // Calculate and display the winner
        const maxVotes = Math.max(
          ...props.candidates.map((candidate) => candidate.voteCount)
        );
        const winningCandidate = props.candidates.find(
          (candidate) => candidate.voteCount === maxVotes
        );
        setWinner(winningCandidate.name);
      } else {
        const updateRemainingTime = () => {
          const endTime = new Date(votingEndTime);
          const timeDifference = endTime - currentTime;

          // Convert milliseconds to hours, minutes, and seconds
          const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((timeDifference / 1000 / 60) % 60);
          const seconds = Math.floor((timeDifference / 1000) % 60);

          setRemainingTime({ hours, minutes, seconds });
        };

        // Update remaining time every second
        const timer = setInterval(updateRemainingTime, 1000);

        // Call updateRemainingTime once to avoid initial delay
        updateRemainingTime();

        // Clear interval on component unmount
        return () => clearInterval(timer);
      }
    }
  }, [props.account, votingEndTime, currentTime]); // Add currentTime to the dependency array

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update currentTime every second

    return () => clearInterval(timer); // Clear interval on component unmount
  }, []);

  const handleClaimTokens = async () => {
    try {
      if (!props.account) {
        throw new Error("Wallet is not connected.");
      }

      // Claim tokens only if not already claimed
      if (!claimed) {
        // Claim tokens with the provided amount and recipient address
        await claimTokens({ amount, to: props.account });
        setClaimBtn(false);

        // Update local storage to indicate tokens are claimed
        localStorage.setItem("claimedTokens", true);
        setClaimed(true);
      }
    } catch (error) {
      console.error("Error claiming tokens:", error.message);
      setClaimBtn(false);
    }
  };

  return (
    <div className="connected-container">
      <h1 className="connected-header">You are Connected to Metamask</h1>
      <p className="connected-account">Metamask Account: {props.account}</p>
      {props.account === "0xC1D7A85beFbE235b91D373c98819F234422b2a0a" ||
      props.account === "0x9C76FbD3bc34b773886e6CDABcEBC86bcc809337" ? (
        <Link to="/dashboard" className="text-3xl font-bold p-4">
          Visit Admin Dashboard
        </Link>
      ) : null}
      {claimed && (
        <p className="connected-account">You've already claimed your tokens.</p>
      )}
      {remainingTime ? (
        <p className="connected-account">
          Remaining Time: {remainingTime.hours} hours {remainingTime.minutes}{" "}
          minutes {remainingTime.seconds} seconds
        </p>
      ) : null}
      {props.showButton ? (
        <>
          {!claimed && (
            <p className="connected-account">
              You have already voted, claim your 50 ERC token
            </p>
          )}
          {claimBtn && !claimed && (
            <button className="login-button" onClick={handleClaimTokens}>
              Claim {amount} {tokenSupply?.symbol}
            </button>
          )}
        </>
      ) : (
        <div>
          <input
            type="number"
            placeholder="Enter Candidate Index"
            value={props.number}
            onChange={props.handleNumberChange}
          />
          <button className="login-button " onClick={props.voteFunction}>
            Vote
          </button>
        </div>
      )}

      {votingStartTime && votingEndTime && props.candidates.length > 0 && (
        <table id="myTable" className="candidates-table mt-6">
          <thead>
            <tr>
              <th>Index</th>
              <th>Candidate name</th>
              <th>Candidate votes</th>
            </tr>
          </thead>
          <tbody>
            {props.candidates.map((candidate, index) => (
              <tr key={index}>
                <td>{candidate.index}</td>
                <td>{candidate.name}</td>
                <td>{candidate.voteCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!votingStartTime && (
        <p className="connected-account">
          Voting is scheduled to start at{" "}
          {new Date(votingStartTime).toLocaleString()}.
        </p>
      )}
      {currentTime > votingEndTime && (
        <p className="connected-account">
          Voting has ended. The winner is {winner}.
        </p>
      )}
    </div>
  );
};

export default Connected;
