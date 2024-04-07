import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractAbi, contractAddress } from "./Constant/constant";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const [votingStartTime, setVotingStartTime] = useState(null);
  const [votingEndTime, setVotingEndTime] = useState(null);
  const [contractInstance, setContractInstance] = useState(null);

  useEffect(() => {
    async function initializeContract() {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contractAddress = "0xABaf674777f09D92D80bBf412340EFaA40a1381A"; // Replace with your contract address
        const Abi = contractAbi; // Replace with your contract ABI
        const contract = new ethers.Contract(contractAddress, Abi, signer);
        setContractInstance(contract);

        const startTime = await contract.votingStart();
        const endTime = await contract.votingEnd();
        setVotingStartTime(new Date(startTime.toNumber() * 1000)); // Convert from seconds to milliseconds
        setVotingEndTime(new Date(endTime.toNumber() * 1000)); // Convert from seconds to milliseconds
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    }

    initializeContract();
    console.log("called");
  }, []);

  const setVotingStartTimeInContract = async (sTime) => {
    try {
      await contractInstance.setVotingStart(sTime.getTime() / 1000); // Convert from milliseconds to seconds
      setVotingStartTime(sTime);
    } catch (error) {
      console.error("Error setting voting start time in contract:", error);
    }
  };

  const setVotingEndTimeInContract = async (eTime) => {
    try {
      await contractInstance.setVotingEnd(eTime.getTime() / 1000); // Convert from milliseconds to seconds
      setVotingEndTime(eTime);
    } catch (error) {
      console.error("Error setting voting end time in contract:", error);
    }
  };

  console.log(votingStartTime, "for ayush");
  return (
    <StateContext.Provider
      value={{
        votingStartTime,
        votingEndTime,
        setVotingStartTime: setVotingStartTimeInContract,
        setVotingEndTime: setVotingEndTimeInContract,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => React.useContext(StateContext);
