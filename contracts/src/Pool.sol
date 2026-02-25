// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVerifier} from "./balanceVerifier/depositVerifier.sol";
import {IMT, Poseidon2} from "./balanceVerifier/IMT.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Settlement} from "./Settlement.sol";
import { ReceiverTemplate } from "./interfaces/ReceiverTemplate.sol";

interface IIDVerifier {
    function verifyID(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifier
        ) external;
}

contract Pool is IMT, Settlement, ReceiverTemplate {
    IVerifier public immutable i_depositVerifier;
    IVerifier public immutable i_withdrawVerifier;

    IIDVerifier public i_idVerifier;

    mapping(bytes32 => bool) public s_nullifierHashes; // used nullifiers to prevent double spending
    mapping(bytes32 => bool) public s_commitments; // we store all commitments just to prevent accidental deposits with the same commitment

    bytes32[] public commitments; // array of all commitments, used for easy retrieval of commitments
    
    event WalletCreated(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
    event Deposit(bytes32 indexed commitment, uint256 value, uint32 leafIndex, uint256 timestamp);
    event Withdrawal(address to, uint256 amount, bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);

    error Mixer__DepositValueMismatch(uint256 expected, uint256 actual);
    error Mixer__PaymentFailed(address recipient, uint256 amount);
    error Mixer__NoteAlreadySpent(bytes32 nullifierHash);
    error Mixer__UnknownRoot(bytes32 root);
    error Mixer__InvalidWithdrawProof();
    error Mixer__InvalidDepositProof();
    error Mixer__CommitmentAlreadyAdded(bytes32 commitment);


    constructor(address _depositVerifier, address _withdrawVerifier, Poseidon2 _hasher, uint32 _merkleTreeDepth, address _idVerifier,
                address forwarderAddress, address _usdc)
        IMT(_merkleTreeDepth, _hasher)
        Settlement(_usdc)
        ReceiverTemplate(forwarderAddress)
    {
        i_depositVerifier = IVerifier(_depositVerifier);
        i_withdrawVerifier = IVerifier(_withdrawVerifier);
        i_idVerifier = IIDVerifier(_idVerifier);
    }

    struct IDProof {
        bytes idProof;
        bytes32 idRoot;
        bytes32 idNullifier;
    }

    struct DepositProof {
        bytes _proof;
        bytes32 _root;
        bytes32 _nullifierHash;
        address  _depositer;
        uint256 _amount;
        bytes32 _newNullifierHash;
        bytes32 _newCommitment;
    }

    struct WithdrawProof {
        bytes _proof;
        bytes32 _root;
        bytes32 _nullifierHash;
        address  _recipient;
        uint256 _amount;
        bytes32 _newNullifierHash;
        bytes32 _newCommitment;
    }

    function createWallet(
        IDProof calldata id, 
        bytes32 _commitment
        ) external {

        i_idVerifier.verifyID(id.idProof, id.idRoot, id.idNullifier);

        // check if the commitment is already added
        if(s_commitments[_commitment]) {
            revert Mixer__CommitmentAlreadyAdded(_commitment);
        }

        // add the commitment to the added commitments mapping
        s_commitments[_commitment] = true;

        // insert the commitment into the Merkle tree
        uint32 insertedIndex = _insert(_commitment);

        commitments.push(_commitment); // add the commitment to the array of all commitments

        emit WalletCreated(_commitment, insertedIndex, block.timestamp);

    }


    function deposit(
        IDProof calldata id, 
        DepositProof calldata d
        ) external {

        i_idVerifier.verifyID(id.idProof, id.idRoot, id.idNullifier);

        require(d._amount > 0, "Deposit amount must be greater than zero");

        // check if the nullifier is already used
        if (s_nullifierHashes[d._nullifierHash]) {
            revert Mixer__NoteAlreadySpent({nullifierHash: d._nullifierHash});
        }
        // check if the root is a valid root
        if (!isKnownRoot(d._root)) {
            revert Mixer__UnknownRoot({root: d._root});
        }
        bytes32[] memory publicInputs = new bytes32[](6);
        publicInputs[0] = d._root; // the root of the Merkle tree
        publicInputs[1] = d._nullifierHash; // the nullifier hash
        publicInputs[2] = bytes32(uint256(uint160(address(d._depositer)))); // the recipient address
        publicInputs[3] = bytes32(d._amount); // the amount to deposit
        publicInputs[4] = d._newNullifierHash; // the new nullifier hash
        publicInputs[5] = d._newCommitment; // the new commitment

        // verify the proof - check the Merkle proof against the root, the ZK proof to check the commitments match, they know a valid nullifier hash and secret, a valid root and the recipient hasn't been modified
        if (!i_depositVerifier.verify(d._proof, publicInputs)) {
            revert Mixer__InvalidDepositProof();
        }

        s_nullifierHashes[d._nullifierHash] = true; // mark the nullifier as used before depositing the funds

        // check if the commitment is already added
        if(s_commitments[d._newCommitment]) {
            revert Mixer__CommitmentAlreadyAdded(d._newCommitment);
        }

        // add the commitment to the added commitments mapping
        s_commitments[d._newCommitment] = true;

        // insert the commitment into the Merkle tree
        uint32 insertedIndex = _insert(d._newCommitment);

        commitments.push(d._newCommitment); // add the commitment to the array of all commitments

        // transfer the funds to the contract
        require(usdc.transferFrom(d._depositer, address(this), d._amount), "Transfer failed");

        emit Deposit(d._newCommitment, d._amount, insertedIndex, block.timestamp);
    }

   
    function withdraw(
        IDProof calldata id, 
        WithdrawProof calldata w
    ) external {

        i_idVerifier.verifyID(id.idProof, id.idRoot, id.idNullifier);

        // check if the nullifier is already used
        if (s_nullifierHashes[w._nullifierHash]) {
            revert Mixer__NoteAlreadySpent({nullifierHash: w._nullifierHash});
        }
        // check if the root is a valid root
        if (!isKnownRoot(w._root)) {
            revert Mixer__UnknownRoot({root: w._root});
        }
        bytes32[] memory publicInputs = new bytes32[](6);
        publicInputs[0] = w._root; // the root of the Merkle tree
        publicInputs[1] = w._nullifierHash; // the nullifier hash
        publicInputs[2] = bytes32(uint256(uint160(address(w._recipient)))); // the recipient address
        publicInputs[3] = bytes32(w._amount); // the amount to withdraw
        publicInputs[4] = w._newNullifierHash; // the new nullifier hash
        publicInputs[5] = w._newCommitment; // the new commitment

        // verify the proof - check the Merkle proof against the root, the ZK proof to check the commitments match, they know a valid nullifier hash and secret, a valid root and the recipient hasn't been modified
        if (!i_withdrawVerifier.verify(w._proof, publicInputs)) {
            revert Mixer__InvalidWithdrawProof();
        }

        s_nullifierHashes[w._nullifierHash] = true; // mark the nullifier as used before sending the funds

        // check if the commitment is already added
        if(s_commitments[w._newCommitment]) {
            revert Mixer__CommitmentAlreadyAdded(w._newCommitment);
        }

        // add the commitment to the added commitments mapping
        s_commitments[w._newCommitment] = true;

        // insert the commitment into the Merkle tree
        uint32 insertedIndex = _insert(w._newCommitment);

        commitments.push(w._newCommitment); // add the commitment to the array of all commitments

        require(usdc.transfer(w._recipient, w._amount), "Transfer failed");

        emit Withdrawal(w._recipient, w._amount, w._newCommitment, insertedIndex, block.timestamp);
    }

    function swap(
        IDProof memory id, 
        WithdrawProof memory w,
        bytes memory route
    ) public payable {

        i_idVerifier.verifyID(id.idProof, id.idRoot, id.idNullifier);

        // check if the nullifier is already used
        if (s_nullifierHashes[w._nullifierHash]) {
            revert Mixer__NoteAlreadySpent({nullifierHash: w._nullifierHash});
        }
        // check if the root is a valid root
        if (!isKnownRoot(w._root)) {
            revert Mixer__UnknownRoot({root: w._root});
        }
        bytes32[] memory publicInputs = new bytes32[](6);
        publicInputs[0] = w._root; // the root of the Merkle tree
        publicInputs[1] = w._nullifierHash; // the nullifier hash
        publicInputs[2] = bytes32(uint256(uint160(address(w._recipient)))); // the recipient address
        publicInputs[3] = bytes32(w._amount); // the amount to withdraw
        publicInputs[4] = w._newNullifierHash; // the new nullifier hash
        publicInputs[5] = w._newCommitment; // the new commitment

        // verify the proof - check the Merkle proof against the root, the ZK proof to check the commitments match, they know a valid nullifier hash and secret, a valid root and the recipient hasn't been modified
        if (!i_withdrawVerifier.verify(w._proof, publicInputs)) {
            revert Mixer__InvalidWithdrawProof();
        }

        s_nullifierHashes[w._nullifierHash] = true; // mark the nullifier as used before sending the funds

        // check if the commitment is already added
        if(s_commitments[w._newCommitment]) {
            revert Mixer__CommitmentAlreadyAdded(w._newCommitment);
        }

        // add the commitment to the added commitments mapping
        s_commitments[w._newCommitment] = true;

        // insert the commitment into the Merkle tree
        uint32 insertedIndex = _insert(w._newCommitment);

        commitments.push(w._newCommitment); // add the commitment to the array of all commitments

        settleTrade(route, w._amount);
        
        emit Withdrawal(w._recipient, w._amount, w._newCommitment, insertedIndex, block.timestamp);
    }

    function _processReport(bytes calldata report) internal override {
        (IDProof memory id, WithdrawProof memory w, bytes memory route) = abi.decode(report, (IDProof,WithdrawProof,bytes));
        swap(id,w,route);
    }

    function getCommitments() external view returns (bytes32[] memory) {
        return commitments;
    }

        function withdrawUSDC(address to, uint256 amount)
        external
        onlyOwner
    {
        require(usdc.transfer(to, amount), "USDC transfer failed");
        emit Withdrawn(to, amount);
    }

    function withdrawAllUSDC(address to)
        external
        onlyOwner
    {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "no USDC");
        require(usdc.transfer(to, balance), "USDC transfer failed");
        emit Withdrawn(to, balance);
    }

}   