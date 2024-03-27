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

const Connected = (props) => {
  const [amount, setAmount] = useState(50); // Initialize amount state with 50
  const address = useAddress();
  const tokenDrop = useTokenDrop("0x055560F27F017ffbe774D594D7A201038A295879");
  const { data: tokenSupply } = useTokenSupply(tokenDrop);
  const { data: tokenBalance } = useTokenBalance(tokenDrop, address);
  const [signer, setSigner] = useState(null);
  const [claimBtn, setClaimBtn] = useState(props.showButton);

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
  }, [props.account]);

  const handleClaimTokens = async () => {
    try {
      if (!props.account) {
        throw new Error("Wallet is not connected.");
      }

      // Claim tokens with the provided amount and recipient address
      await claimTokens({ amount, to: props.account });
      setClaimBtn(false);
    } catch (error) {
      console.error("Error claiming tokens:", error.message);
      setClaimBtn(false);
    }
  };

  return (
    <div className="connected-container">
      <h1 className="connected-header">You are Connected to Metamask</h1>
      <p className="connected-account">Metamask Account: {props.account}</p>
      <p className="connected-account">Remaining Time: {props.remainingTime}</p>
      {props.showButton ? (
        <>
          <p className="connected-account">
            You have already voted, claim your 50 ERC token
          </p>
          {setClaimBtn && (
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
          <br />
          <button className="login-button" onClick={props.voteFunction}>
            Vote
          </button>
        </div>
      )}

      <table id="myTable" className="candidates-table">
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
    </div>
  );
};

export default Connected;
