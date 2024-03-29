async function main() {
  const Voting = await ethers.getContractFactory("Voting");

  // Start deployment, returning a promise that resolves to a contract object
  const Voting_ = await Voting.deploy(); // Passing only duration, candidate addition will be done from frontend
  console.log("Contract address:", Voting_.address);

  // Adding candidates from frontend
  // await Voting_.addCandidate("Mark");
  // await Voting_.addCandidate("Mike");
  // await Voting_.addCandidate("Henry");
  // await Voting_.addCandidate("Rock");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
