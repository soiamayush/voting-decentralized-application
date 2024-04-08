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
import { contractAbi, contractAddress } from "../Constant/constant";

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

  const [response1, setResponse1] = useState(""); // State variable for the first question
  const [response2, setResponse2] = useState(""); // State variable for the second question
  const [response3, setResponse3] = useState("");

  const handleServiceSelection = useCallback((event) => {
    setSelectedService(event.target.value);
  }, []);

  const handleResponse1Change = (event) => {
    setResponse1(event.target.value);
  };

  const handleResponse2Change = (event) => {
    setResponse2(event.target.value);
  };

  const handleResponse3Change = (event) => {
    setResponse3(event.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save responses
    console.log("Response 1:", response1);
    console.log("Response 2:", response2);
    console.log("Response 3:", response3);
    // Add your logic here to save the responses
    selectRandomCandidate();
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
      {/* // <p className="connected-account">You've already claimed your tokens.</p> */}
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
          <button className="login-button" onClick={props.voteFunction}>
            Vote
          </button>
          <button className="login-button" onClick={handleClaimTokens}>
            Claim {amount} {tokenSupply?.symbol}
          </button>
        </div>
      )}

      {votingStartTime && currentTime && props.candidates.length > 0 && (
        <form className="flex items-center justify-center flex-col">
          <div className="flex flex-col gap-y-6 justify-center items-center">
            {/* Existing JSX code... */}

            {/* New question 1 */}
            <select
              value={response1}
              onChange={handleResponse1Change}
              className="border p-2"
            >
              <option value="">Select Candidate Qualifications</option>
              <option value="Extensive experience in relevant field">
                Extensive experience in relevant field
              </option>
              <option value="Strong leadership skills">
                Strong leadership skills
              </option>
              <option value="Track record of community involvement">
                Track record of community involvement
              </option>
              <option value="Vision for the future">
                Vision for the future
              </option>
            </select>

            {/* New question 2 */}
            <select
              value={response2}
              onChange={handleResponse2Change}
              className="border p-2"
            >
              <option value="">Select Policy Alignment</option>
              <option value="Supports policies that align with my values and beliefs">
                Supports policies that align with my values and beliefs
              </option>
              <option value="Demonstrates understanding of key issues facing the community">
                Demonstrates understanding of key issues facing the community
              </option>
              <option value="Offers practical solutions to address those issues">
                Offers practical solutions to address those issues
              </option>
              <option value="Open to collaboration and compromise">
                Open to collaboration and compromise
              </option>
            </select>

            {/* New question 3 */}
            <select
              value={response3}
              onChange={handleResponse3Change}
              className="border p-2"
            >
              <option value="">Select Trustworthiness and Integrity</option>
              <option value="Demonstrates honesty and transparency in actions and statements">
                Demonstrates honesty and transparency in actions and statements
              </option>
              <option value="Has a history of keeping promises and commitments">
                Has a history of keeping promises and commitments
              </option>
              <option value="Respects diverse perspectives and values inclusivity">
                Respects diverse perspectives and values inclusivity
              </option>
              <option value="Prioritizes the well-being of constituents over personal interests">
                Prioritizes the well-being of constituents over personal
                interests
              </option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="font-bold p-4 bg-blue-500 text-white border rounded-xl hover:bg-blue-700 m-auto w-auto "
          >
            Submit
          </button>
        </form>
      )}
      {selectedCandidate && response1 && response2 && response3 && (
        <p className="font-bold my-6 text-2xl text-center">
          Candidate Suggested : {selectedCandidate.name}
        </p>
      )}

      {currentTime > votingEndTime && props.candidates.length > 0 ? (
        <div className="w-full m-auto flex justify-center items-center flex-col ">
          <h2 className="connected-account flex justify-center my-6 font-bold">
            Voters Book:
          </h2>

          {/* <div className="flex items-center justify-center">
            <table id="myTable" className="candidates-table mt-6 ">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Voter Address</th>
                </tr>
              </thead>
              <tbody>
                {props.candidateVoters?.map((voter, index) => (
                  <tr key={index}>
                    <td>{voter?.candidateIndex.toString()}</td>
                    <td>{voter?.voterAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div> */}

          <div className="mx-20"></div>
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
      {winner && currentTime > votingEndTime && (
        <h1 className="connected-account font-bold my-8">
          Voting has ended. The winner is {winner}.
        </h1>
      )}
    </div>
  );
};

export default Connected;
