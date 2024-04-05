import React, { useEffect, useState, useCallback } from "react";
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

const services = [
  "Infrastructure",
  "Education",
  "Employment",
  "Healthcare",
  "Student Loan",
  "Public Services",
];

const Connected = (props) => {
  const getPosition = (index) => {
    switch (index) {
      case 0:
        return "First Winner";
      case 1:
        return "Second Winner";
      case 2:
        return "Third Winner";
      default:
        return `${index + 1}th Position`;
    }
  };

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedService, setSelectedService] = useState("");
  const [amount, setAmount] = useState(50);
  const address = useAddress();
  const tokenDrop = useTokenDrop("0x055560F27F017ffbe774D594D7A201038A295879");
  const { data: tokenSupply } = useTokenSupply(tokenDrop);
  const { data: tokenBalance } = useTokenBalance(tokenDrop, address);
  const [signer, setSigner] = useState(null);
  const { votingStartTime, votingEndTime } = useStateContext();
  const [remainingTime, setRemainingTime] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [winner, setWinner] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getSigner = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    setSigner(provider.getSigner());
  }, []);

  const { mutate: claimTokens } = useClaimToken(tokenDrop, signer);

  useEffect(() => {
    setAmount(50);
    getSigner();
    const claimedTokens = localStorage.getItem("claimedTokens");
    if (claimedTokens) {
      setClaimed(true);
    }
    if (currentTime < votingStartTime) {
      const timeDifference = votingStartTime - currentTime;
      const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeDifference / 1000 / 60) % 60);
      const seconds = Math.floor((timeDifference / 1000) % 60);
      setRemainingTime({ hours, minutes, seconds });
    } else if (votingEndTime && currentTime) {
      if (currentTime > votingEndTime) {
        setRemainingTime(null);
        const maxVotes = Math.max(
          ...props.candidates.map((candidate) => candidate.voteCount)
        );
        const winningCandidate = props.candidates.find(
          (candidate) => candidate.voteCount === maxVotes
        );
        setWinner(winningCandidate.name);
      } else {
        const timeDifference = votingEndTime - currentTime;
        const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDifference / 1000 / 60) % 60);
        const seconds = Math.floor((timeDifference / 1000) % 60);
        setRemainingTime({ hours, minutes, seconds });
        const timer = setInterval(() => {
          const updatedTimeDifference = votingEndTime - new Date();
          if (updatedTimeDifference <= 0) {
            clearInterval(timer);
            setRemainingTime(null);
          } else {
            const updatedHours = Math.floor(
              (updatedTimeDifference / (1000 * 60 * 60)) % 24
            );
            const updatedMinutes = Math.floor(
              (updatedTimeDifference / 1000 / 60) % 60
            );
            const updatedSeconds = Math.floor(
              (updatedTimeDifference / 1000) % 60
            );
            setRemainingTime({
              hours: updatedHours,
              minutes: updatedMinutes,
              seconds: updatedSeconds,
            });
          }
        }, 1000);
      }
    }
  }, [
    props.account,
    votingStartTime,
    votingEndTime,
    currentTime,
    props.candidates,
    getSigner,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // useEffect(() => {
  const selectRandomCandidate = () => {
    if (props.candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * props.candidates.length);
      setSelectedCandidate(props.candidates[randomIndex]);
    }
  };

  const handleClaimTokens = useCallback(async () => {
    try {
      if (!props.account) {
        throw new Error("Wallet is not connected.");
      }

      await claimTokens({ amount, to: address });
      console.log("s");
    } catch (error) {
      console.error("Error claiming tokens:", error.message);
    }
  }, [props.account, claimTokens, amount, address, tokenBalance]);

  const handleServiceSelection = useCallback((event) => {
    setSelectedService(event.target.value);
    selectRandomCandidate();
  }, []);

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
          {currentTime < votingStartTime
            ? `Voting will start in: ${remainingTime.hours} hours ${remainingTime.minutes} minutes ${remainingTime.seconds} seconds`
            : `The Voting is started and will end in: ${remainingTime.hours} hours ${remainingTime.minutes} minutes ${remainingTime.seconds} seconds`}
        </p>
      ) : null}
      {votingStartTime < currentTime && currentTime < votingEndTime && (
        <div className="flex gap-x-10">
          <input
            type="number"
            placeholder="Enter Candidate Index"
            value={props.number}
            onChange={props.handleNumberChange}
          />
          <button className="login-button " onClick={props.voteFunction}>
            Vote
          </button>
          <button className="login-button" onClick={handleClaimTokens}>
            Claim {amount} {tokenSupply?.symbol}
          </button>
        </div>
      )}

      {votingStartTime && currentTime && props.candidates.length > 0 && (
        <form className="">
          <div className="flex flex-col gap-y-6 justify-center items-center">
            <p>Choose the service you want from your candidate:</p>
            {services.map((service) => (
              <label key={service}>
                <input
                  type="radio"
                  value={service}
                  checked={selectedService === service}
                  onChange={handleServiceSelection}
                />
                {service}
              </label>
            ))}
          </div>
        </form>
      )}
      {selectedService && selectedCandidate && (
        <p className="font-bold my-6 text-2xl text-center">
          Selected Service: {selectedService}
          <br />
          Candidate Suggested for {selectedService}: {selectedCandidate.name}
        </p>
      )}

      {currentTime > votingEndTime && props.candidates.length > 0 ? (
        <div className="w-full m-auto flex justify-center items-center flex-col ">
          <h2 className="connected-account flex justify-center my-6 font-bold">
            Voters Book:
          </h2>
          <table id="myTable" className="candidates-table mt-6 ">
            <thead>
              <tr>
                <th>Position</th>
                <th>Candidate name</th>
                <th>Candidate votes</th>
              </tr>
            </thead>
            <tbody>
              {props.candidates
                .slice()
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((candidate, index) => (
                  <tr key={index}>
                    <td>{getPosition(index)}</td>
                    <td>{candidate.name}</td>
                    <td>{candidate.voteCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
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
      {currentTime > votingEndTime && (
        <h1 className="connected-account font-bold my-8">
          Voting has ended. The winner is {winner}.
        </h1>
      )}
    </div>
  );
};

export default Connected;
