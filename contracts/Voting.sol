// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    address public owner;
    mapping(address => bool) public voters;

    uint256 public votingStart;
    uint256 public votingEnd;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner can call this function"
        );
        _;
    }

    function addCandidate(string memory _name) public onlyOwner {
        candidates.push(Candidate({name: _name, voteCount: 0}));
    }

    function vote(uint256 _candidateIndex) public {
        require(!voters[msg.sender], "You have already voted.");
        require(
            _candidateIndex < candidates.length,
            "Invalid candidate index."
        );

        candidates[_candidateIndex].voteCount++;
        voters[msg.sender] = true;
    }

    function getAllVotesOfCandidates()
        public
        view
        returns (Candidate[] memory)
    {
        return candidates;
    }

    function getVotingStatus() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp < votingEnd);
    }

    function getRemainingTime() public view returns (uint256) {
        require(block.timestamp >= votingStart, "Voting has not started yet.");
        if (block.timestamp >= votingEnd) {
            return 0;
        }
        return votingEnd - block.timestamp;
    }

    function setVotingStart(uint256 _startTime) public {
        require(
            _startTime > block.timestamp,
            "Start time must be in the future"
        );
        votingStart = _startTime;
    }

    function setVotingEnd(uint256 _endTime) public {
        require(_endTime > block.timestamp, "End time must be in the future");
        require(_endTime > votingStart, "End time must be after start time");
        votingEnd = _endTime;
    }

    function deleteAllCandidates() public {
        delete candidates;
    }
}
