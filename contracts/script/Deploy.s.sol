// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {IDMixer} from "../src/identityMixer/Mixer.sol";
import {IdentityHonkVerifier} from "../src/identityMixer/Verifier.sol";
import {Poseidon2} from "@poseidon/src/Poseidon2.sol";

import {Pool} from "../src/pool.sol";
import {DepositHonkVerifier} from "../src/balanceVerifier/depositVerifier.sol";
import {WithdrawHonkVerifier} from "../src/balanceVerifier/withdrawVerifier.sol";

contract DeployScript is Script {
    IDMixer public idmixer;
    IdentityHonkVerifier public identityVerifier;
    Poseidon2 public hasher;

    Pool public pool;
    DepositHonkVerifier public depositVerifier;
    WithdrawHonkVerifier public withdrawVerifier;

    address public usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public forwarderAddress = 0x5E342a8438B4f5d39e72875FCee6f76B39CCE548;
    function setUp() public {}

    function run() public {

        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        
        hasher = new Poseidon2();
        identityVerifier = new IdentityHonkVerifier();
        idmixer = new IDMixer(identityVerifier,hasher,20,forwarderAddress);

        depositVerifier = new DepositHonkVerifier();
        withdrawVerifier = new WithdrawHonkVerifier();

        pool = new Pool(address(depositVerifier),address(withdrawVerifier),hasher,20,address(idmixer),forwarderAddress,usdc);

        console.log("hasher",address(hasher));
        console.log("identityVerifier",address(identityVerifier));
        console.log("IDMixer", address(idmixer));

        console.log("depositVerifier",address(depositVerifier));
        console.log("withdrawVerifier",address(withdrawVerifier));

        console.log("pool",address(pool));

        vm.stopBroadcast();

    }
}
