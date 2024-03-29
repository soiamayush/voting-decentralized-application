import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { DatePicker, TimePicker, Button } from "antd";
import { useStateContext } from "../DateTimeContext";
import { contractAddress, contractAbi } from "../Constant/constant";
import { Link } from "react-router-dom";

function Dashboard() {
  const {
    votingStartTime,
    votingEndTime,
    setVotingStartTime,
    setVotingEndTime,
  } = useStateContext(); // Access context

  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const [candidateName, setCandidateName] = useState("");
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress,
          [
            "function getAllVotesOfCandidates() view returns (tuple(string name, uint256 voteCount)[])",
            "function addCandidate(string _name)",
            "function deleteAllCandidates()",
          ],
          provider
        );

        const candidatesData = await contract.getAllVotesOfCandidates();
        setCandidates(candidatesData);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    }

    if (contractAddress) {
      fetchCandidates();
    }
  }, [contractAddress]);

  useEffect(() => {
    // Determine the voting status message every time votingStartTime or votingEndTime changes
    if (votingStartTime && votingEndTime) {
      const currentTime = new Date();
      if (currentTime < votingStartTime) {
        setMessage(
          `Voting is scheduled to start at ${votingStartTime.toLocaleString()} and end at ${votingEndTime.toLocaleString()}`
        );
      } else if (
        currentTime >= votingStartTime &&
        currentTime <= votingEndTime
      ) {
        setMessage("Voting is already in progress");
      } else {
        setMessage(
          "Voting has ended. Please wait for the next voting session."
        );
      }
    }
  }, [votingStartTime, votingEndTime]);

  const handleStartDateChange = (date) => {
    setSelectedStartDate(date);
  };

  const handleStartTimeChange = (time, timeString) => {
    setSelectedStartTime(new Date(time));
  };

  const handleEndDateChange = (date) => {
    setSelectedEndDate(date);
    setErrorMessage(""); // Reset error message when end date is changed
  };

  const handleEndTimeChange = (time, timeString) => {
    setSelectedEndTime(new Date(time));
    setErrorMessage(""); // Reset error message when end time is changed
  };

  const handleSubmit = async () => {
    try {
      if (
        selectedStartDate &&
        selectedStartTime &&
        selectedEndDate &&
        selectedEndTime
      ) {
        const startDateTime = new Date(selectedStartDate);
        startDateTime.setHours(selectedStartTime.getHours());
        startDateTime.setMinutes(selectedStartTime.getMinutes());

        const endDateTime = new Date(selectedEndDate);
        endDateTime.setHours(selectedEndTime.getHours());
        endDateTime.setMinutes(selectedEndTime.getMinutes());

        if (endDateTime < startDateTime) {
          setErrorMessage("End date/time cannot be before start date/time");
          return;
        }

        await setVotingStartTime(startDateTime);
        await setVotingEndTime(endDateTime);

        setSelectedStartDate(null);
        setSelectedStartTime(null);
        setSelectedEndDate(null);
        setSelectedEndTime(null);
        setMessage("The time for voting has been set.");
      } else {
        setErrorMessage("Please select both start and end date and time");
      }
    } catch (error) {
      console.error("Error setting voting times:", error);
      setErrorMessage("Error setting voting times. Please try again.");
    }
  };

  const handleAddCandidate = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        ["function addCandidate(string _name)"],
        signer
      );

      await contract.addCandidate(candidateName);
      setCandidateName("");
    } catch (error) {
      console.error("Error adding candidate:", error);
    }
  };

  const handleDeleteCandidates = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        ["function deleteAllCandidates()"],
        signer
      );

      await contract.deleteAllCandidates();
      setCandidates([]); // Clear the candidates list
    } catch (error) {
      console.error("Error deleting candidates:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-8 gap-y-2">
      <Link to="/" className="font-bold w-auto m-auto  text-xl sm:text-4xl p-6">
        Voting App
      </Link>
      {message && (
        <p className="text-center text-lg text-yellow-500 font-bold">
          {message}
        </p>
      )}
      <div>
        <h2>Candidates:</h2>
        <ul className="flex flex-col justify-center items-center">
          {candidates?.map((candidate, index) => (
            <li key={index}>{candidate.name}</li>
          ))}
        </ul>
      </div>
      <input
        type="text"
        placeholder="Enter candidate name"
        value={candidateName}
        onChange={(e) => setCandidateName(e.target.value)}
        className="border-black border rounded-lg p-2"
      />
      <br />
      <Button onClick={handleAddCandidate}> Add Candidate</Button>
      <br />
      <Button onClick={handleDeleteCandidates}> Delete All Candidates</Button>
      <br />

      <div>
        <h3 className="pb-3">Set Voting Start Time:</h3>
        <DatePicker onChange={handleStartDateChange} />
        {selectedStartDate && <TimePicker onChange={handleStartTimeChange} />}
      </div>
      <div>
        <h3 className="pb-3">Set Voting End Time:</h3>
        <DatePicker onChange={handleEndDateChange} />
        {selectedEndDate && <TimePicker onChange={handleEndTimeChange} />}
      </div>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <br />
      <Button onClick={handleSubmit}>Set Voting Times</Button>

      {/* Show voting start and end time */}
      {votingStartTime && votingEndTime && (
        <div className="mt-4">
          <p className="font-semibold ">
            Voting Start Time: {votingStartTime.toLocaleString()}
          </p>
          <p className="font-semibold ">
            Voting End Time: {votingEndTime.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
