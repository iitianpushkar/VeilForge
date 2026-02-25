// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVerifier} from "./Verifier.sol";
import {IMT, Poseidon2} from "./IMT.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract IDMixer is IMT, ReentrancyGuard, Ownable(msg.sender) {
    IVerifier public immutable i_verifier;

    mapping(bytes32 => bool) public s_nullifiers; // used nullifiers to prevent usage of same zkProof more than once.
    mapping(bytes32 => bool) public s_documentHashes; // used passports to prevent use of same passport
    mapping(bytes32 => bool) public s_commitments; // we store all commitments just to prevent accidental deposits with the same commitment

    bytes32[] public commitments; // array of all commitments, used for easy retrieval of commitments
    
    event IDCreated(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);

    error Mixer__NullifierAlreadyUsed(bytes32 nullifier);
    error Mixer__UnknownRoot(bytes32 root);
    error Mixer__InvalidIDProof();
    error Mixer__CommitmentAlreadyAdded(bytes32 commitment);

    constructor(IVerifier _verifier, Poseidon2 _hasher, uint32 _merkleTreeDepth)
        IMT(_merkleTreeDepth, _hasher)
    {
        i_verifier = _verifier;
    }

    // comitment is the poseidon2 hash of document number and secret.

    function createID(bytes32 _commitment) external {

        // check if the commitment is already added
        if(s_commitments[_commitment]) {
            revert Mixer__CommitmentAlreadyAdded(_commitment);
        }

        // add the commitment to the added commitments mapping
        s_commitments[_commitment] = true;

        // insert the commitment into the Merkle tree
        uint32 insertedIndex = _insert(_commitment);

        commitments.push(_commitment); // add the commitment to the array of all commitments

        emit IDCreated(_commitment, insertedIndex, block.timestamp);

    }


    function verifyID(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifier
        ) external nonReentrant {

        // check if the nullifier is already used
        if (s_nullifiers[_nullifier]) {
            revert Mixer__NullifierAlreadyUsed({nullifier: _nullifier});
        }
        // check if the root is a valid root
        if (!isKnownRoot(_root)) {
            revert Mixer__UnknownRoot({root: _root});
        }
        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = _root; // the root of the Merkle tree
        publicInputs[1] = _nullifier;

        if (!i_verifier.verify(_proof, publicInputs)) {
            revert Mixer__InvalidIDProof();
        }

        s_nullifiers[_nullifier] = true; // mark the nullifier as used
    }



    function getCommitments() external view returns (bytes32[] memory) {
        return commitments;
    }

}   
