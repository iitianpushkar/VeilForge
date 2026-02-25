// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Aztec
pragma solidity >=0.8.21;

import "./depositLib.sol";

uint256 constant N = 8192;
uint256 constant LOG_N = 13;
uint256 constant NUMBER_OF_PUBLIC_INPUTS = 6;


struct ShpleminiIntermediates {
    Fr unshiftedScalar;
    Fr shiftedScalar;
    // Scalar to be multiplied by [1]₁
    Fr constantTermAccumulator;
    // Accumulator for powers of rho
    Fr batchingChallenge;
    // Linear combination of multilinear (sumcheck) evaluations and powers of rho
    Fr batchedEvaluation;
    // 1/(z - r^{2^i}) for i = 0, ..., logSize, dynamically updated
    Fr posInvertedDenominator;
    // 1/(z + r^{2^i}) for i = 0, ..., logSize, dynamically updated
    Fr negInvertedDenominator;
    // v^{2i} * 1/(z - r^{2^i})
    Fr scalingFactorPos;
    // v^{2i+1} * 1/(z + r^{2^i})
    Fr scalingFactorNeg;
    // // Fold_i(r^{2^i}) reconstructed by Verifier
    // Fr[CONST_PROOF_SIZE_LOG_N] foldPosEvaluations;
}

library CommitmentSchemeLib {
    using FrLib for Fr;

    function computeSquares(Fr r) internal pure returns (Fr[CONST_PROOF_SIZE_LOG_N] memory squares) {
        squares[0] = r;
        for (uint256 i = 1; i < CONST_PROOF_SIZE_LOG_N; ++i) {
            squares[i] = squares[i - 1].sqr();
        }
    }

    // Compute the evaluations  A_l(r^{2^l}) for l = 0, ..., m-1
    function computeFoldPosEvaluations(
        Fr[CONST_PROOF_SIZE_LOG_N] memory sumcheckUChallenges,
        Fr batchedEvalAccumulator,
        Fr[CONST_PROOF_SIZE_LOG_N] memory geminiEvaluations,
        Fr[CONST_PROOF_SIZE_LOG_N] memory geminiEvalChallengePowers,
        uint256 logSize
    ) internal view returns (Fr[CONST_PROOF_SIZE_LOG_N] memory foldPosEvaluations) {
        for (uint256 i = CONST_PROOF_SIZE_LOG_N; i > 0; --i) {
            Fr challengePower = geminiEvalChallengePowers[i - 1];
            Fr u = sumcheckUChallenges[i - 1];

            Fr batchedEvalRoundAcc = (
                (challengePower * batchedEvalAccumulator * Fr.wrap(2))
                    - geminiEvaluations[i - 1] * (challengePower * (Fr.wrap(1) - u) - u)
            );
            // Divide by the denominator
            batchedEvalRoundAcc = batchedEvalRoundAcc * (challengePower * (Fr.wrap(1) - u) + u).invert();

            if (i <= logSize) {
                batchedEvalAccumulator = batchedEvalRoundAcc;
                foldPosEvaluations[i - 1] = batchedEvalRoundAcc;
            }
        }

    }
}

interface IVerifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
}


abstract contract BaseHonkVerifier is IVerifier {
    using FrLib for Fr;

    uint256 immutable n;
    uint256 immutable logN;
    uint256 immutable numPublicInputs;

    constructor(uint256 _n, uint256 _logN, uint256 _numPublicInputs) {
        n = _n;
        logN = _logN;
        numPublicInputs = _numPublicInputs;
    }

    error ProofLengthWrong();
    error PublicInputsLengthWrong();
    error SumcheckFailed();
    error ShpleminiFailed();

    // Number of field elements in a ultra honk zero knowledge proof
    uint256 constant PROOF_SIZE = 440;

    function loadVerificationKey() internal pure virtual returns (Honk.VerificationKey memory);

    function verify(bytes calldata proof, bytes32[] calldata publicInputs) public view override returns (bool) {
         // Check the received proof is the expected size where each field element is 32 bytes
        if (proof.length != PROOF_SIZE * 32) {
            revert ProofLengthWrong();
        }

        Honk.VerificationKey memory vk = loadVerificationKey();
        Honk.Proof memory p = TranscriptLib.loadProof(proof);

        if (publicInputs.length != vk.publicInputsSize) {
            revert PublicInputsLengthWrong();
        }

        // Generate the fiat shamir challenges for the whole protocol
        // TODO(https://github.com/AztecProtocol/barretenberg/issues/1281): Add pubInputsOffset to VK or remove entirely.
        Transcript memory t = TranscriptLib.generateTranscript(p, publicInputs, vk.circuitSize, vk.publicInputsSize, /*pubInputsOffset=*/1);

        // Derive public input delta
        // TODO(https://github.com/AztecProtocol/barretenberg/issues/1281): Add pubInputsOffset to VK or remove entirely.
        t.relationParameters.publicInputsDelta = computePublicInputDelta(
            publicInputs, t.relationParameters.beta, t.relationParameters.gamma, /*pubInputsOffset=*/1
        );

        // Sumcheck
        bool sumcheckVerified = verifySumcheck(p, t);
        if (!sumcheckVerified) revert SumcheckFailed();

        bool shpleminiVerified = verifyShplemini(p, vk, t);
        if (!shpleminiVerified) revert ShpleminiFailed();

        return sumcheckVerified && shpleminiVerified; // Boolean condition not required - nice for vanity :)
    }

    function computePublicInputDelta(bytes32[] memory publicInputs, Fr beta, Fr gamma, uint256 offset)
        internal
        view
        returns (Fr publicInputDelta)
    {
        Fr numerator = Fr.wrap(1);
        Fr denominator = Fr.wrap(1);

        Fr numeratorAcc = gamma + (beta * FrLib.from(n + offset));
        Fr denominatorAcc = gamma - (beta * FrLib.from(offset + 1));

        {
            for (uint256 i = 0; i < numPublicInputs; i++) {
                Fr pubInput = FrLib.fromBytes32(publicInputs[i]);

                numerator = numerator * (numeratorAcc + pubInput);
                denominator = denominator * (denominatorAcc + pubInput);

                numeratorAcc = numeratorAcc + beta;
                denominatorAcc = denominatorAcc - beta;
            }
        }

        // Fr delta = numerator / denominator; // TOOO: batch invert later?
        publicInputDelta = FrLib.div(numerator, denominator);
    }

    function verifySumcheck(Honk.Proof memory proof, Transcript memory tp) internal view returns (bool verified) {
        Fr roundTarget;
        Fr powPartialEvaluation = Fr.wrap(1);

        // We perform sumcheck reductions over log n rounds ( the multivariate degree )
        for (uint256 round; round < logN; ++round) {
            Fr[BATCHED_RELATION_PARTIAL_LENGTH] memory roundUnivariate = proof.sumcheckUnivariates[round];
            bool valid = checkSum(roundUnivariate, roundTarget);
            if (!valid) revert SumcheckFailed();

            Fr roundChallenge = tp.sumCheckUChallenges[round];

            // Update the round target for the next rounf
            roundTarget = computeNextTargetSum(roundUnivariate, roundChallenge);
            powPartialEvaluation = partiallyEvaluatePOW(tp.gateChallenges[round], powPartialEvaluation, roundChallenge);
        }

        // Last round
        Fr grandHonkRelationSum =
            RelationsLib.accumulateRelationEvaluations(proof.sumcheckEvaluations, tp.relationParameters, tp.alphas, powPartialEvaluation);
        verified = (grandHonkRelationSum == roundTarget);
    }

    function checkSum(Fr[BATCHED_RELATION_PARTIAL_LENGTH] memory roundUnivariate, Fr roundTarget)
        internal
        pure
        returns (bool checked)
    {
        Fr totalSum = roundUnivariate[0] + roundUnivariate[1];
        checked = totalSum == roundTarget;
    }

    // Return the new target sum for the next sumcheck round
    function computeNextTargetSum(Fr[BATCHED_RELATION_PARTIAL_LENGTH] memory roundUnivariates, Fr roundChallenge)
        internal
        view
        returns (Fr targetSum)
    {
        // TODO: inline
        Fr[BATCHED_RELATION_PARTIAL_LENGTH] memory BARYCENTRIC_LAGRANGE_DENOMINATORS = [
            Fr.wrap(0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593efffec51),
            Fr.wrap(0x00000000000000000000000000000000000000000000000000000000000002d0),
            Fr.wrap(0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593efffff11),
            Fr.wrap(0x0000000000000000000000000000000000000000000000000000000000000090),
            Fr.wrap(0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593efffff71),
            Fr.wrap(0x00000000000000000000000000000000000000000000000000000000000000f0),
            Fr.wrap(0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593effffd31),
            Fr.wrap(0x00000000000000000000000000000000000000000000000000000000000013b0)
        ];

        // To compute the next target sum, we evaluate the given univariate at a point u (challenge).

        // Performing Barycentric evaluations
        // Compute B(x)
        Fr numeratorValue = Fr.wrap(1);
        for (uint256 i = 0; i < BATCHED_RELATION_PARTIAL_LENGTH; ++i) {
            numeratorValue = numeratorValue * (roundChallenge - Fr.wrap(i));
        }

        // Calculate domain size N of inverses
        Fr[BATCHED_RELATION_PARTIAL_LENGTH] memory denominatorInverses;
        for (uint256 i = 0; i < BATCHED_RELATION_PARTIAL_LENGTH; ++i) {
            Fr inv = BARYCENTRIC_LAGRANGE_DENOMINATORS[i];
            inv = inv * (roundChallenge - Fr.wrap(i));
            inv = FrLib.invert(inv);
            denominatorInverses[i] = inv;
        }

        for (uint256 i = 0; i < BATCHED_RELATION_PARTIAL_LENGTH; ++i) {
            Fr term = roundUnivariates[i];
            term = term * denominatorInverses[i];
            targetSum = targetSum + term;
        }

        // Scale the sum by the value of B(x)
        targetSum = targetSum * numeratorValue;
    }

    // Univariate evaluation of the monomial ((1-X_l) + X_l.B_l) at the challenge point X_l=u_l
    function partiallyEvaluatePOW(Fr gateChallenge, Fr currentEvaluation, Fr roundChallenge)
        internal
        pure
        returns (Fr newEvaluation)
    {
        Fr univariateEval = Fr.wrap(1) + (roundChallenge * (gateChallenge - Fr.wrap(1)));
        newEvaluation = currentEvaluation * univariateEval;
    }

    function verifyShplemini(Honk.Proof memory proof, Honk.VerificationKey memory vk, Transcript memory tp)
        internal
        view
        returns (bool verified)
    {
        ShpleminiIntermediates memory mem; // stack

        // - Compute vector (r, r², ... , r²⁽ⁿ⁻¹⁾), where n = log_circuit_size
        Fr[CONST_PROOF_SIZE_LOG_N] memory powers_of_evaluation_challenge = CommitmentSchemeLib.computeSquares(tp.geminiR);

        // Arrays hold values that will be linearly combined for the gemini and shplonk batch openings
        Fr[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 2] memory scalars;
        Honk.G1Point[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 2] memory commitments;

        mem.posInvertedDenominator = (tp.shplonkZ - powers_of_evaluation_challenge[0]).invert();
        mem.negInvertedDenominator = (tp.shplonkZ + powers_of_evaluation_challenge[0]).invert();

        mem.unshiftedScalar = mem.posInvertedDenominator + (tp.shplonkNu * mem.negInvertedDenominator);
        mem.shiftedScalar =
            tp.geminiR.invert() * (mem.posInvertedDenominator - (tp.shplonkNu * mem.negInvertedDenominator));

        scalars[0] = Fr.wrap(1);
        commitments[0] = convertProofPoint(proof.shplonkQ);

        mem.batchingChallenge = Fr.wrap(1);
        mem.batchedEvaluation = Fr.wrap(0);

        for (uint256 i = 1; i <= NUMBER_UNSHIFTED; ++i) {
            scalars[i] = mem.unshiftedScalar.neg() * mem.batchingChallenge;
            mem.batchedEvaluation = mem.batchedEvaluation + (proof.sumcheckEvaluations[i - 1] * mem.batchingChallenge);
            mem.batchingChallenge = mem.batchingChallenge * tp.rho;
        }
        // g commitments are accumulated at r
        for (uint256 i = NUMBER_UNSHIFTED + 1; i <= NUMBER_OF_ENTITIES; ++i) {
            scalars[i] = mem.shiftedScalar.neg() * mem.batchingChallenge;
            mem.batchedEvaluation = mem.batchedEvaluation + (proof.sumcheckEvaluations[i - 1] * mem.batchingChallenge);
            mem.batchingChallenge = mem.batchingChallenge * tp.rho;
        }

        commitments[1] = vk.qm;
        commitments[2] = vk.qc;
        commitments[3] = vk.ql;
        commitments[4] = vk.qr;
        commitments[5] = vk.qo;
        commitments[6] = vk.q4;
        commitments[7] = vk.qLookup;
        commitments[8] = vk.qArith;
        commitments[9] = vk.qDeltaRange;
        commitments[10] = vk.qElliptic;
        commitments[11] = vk.qAux;
        commitments[12] = vk.qPoseidon2External;
        commitments[13] = vk.qPoseidon2Internal;
        commitments[14] = vk.s1;
        commitments[15] = vk.s2;
        commitments[16] = vk.s3;
        commitments[17] = vk.s4;
        commitments[18] = vk.id1;
        commitments[19] = vk.id2;
        commitments[20] = vk.id3;
        commitments[21] = vk.id4;
        commitments[22] = vk.t1;
        commitments[23] = vk.t2;
        commitments[24] = vk.t3;
        commitments[25] = vk.t4;
        commitments[26] = vk.lagrangeFirst;
        commitments[27] = vk.lagrangeLast;

        // Accumulate proof points
        commitments[28] = convertProofPoint(proof.w1);
        commitments[29] = convertProofPoint(proof.w2);
        commitments[30] = convertProofPoint(proof.w3);
        commitments[31] = convertProofPoint(proof.w4);
        commitments[32] = convertProofPoint(proof.zPerm);
        commitments[33] = convertProofPoint(proof.lookupInverses);
        commitments[34] = convertProofPoint(proof.lookupReadCounts);
        commitments[35] = convertProofPoint(proof.lookupReadTags);

        // to be Shifted
        commitments[36] = convertProofPoint(proof.w1);
        commitments[37] = convertProofPoint(proof.w2);
        commitments[38] = convertProofPoint(proof.w3);
        commitments[39] = convertProofPoint(proof.w4);
        commitments[40] = convertProofPoint(proof.zPerm);

        // Add contributions from A₀(r) and A₀(-r) to constant_term_accumulator:
        // Compute the evaluations A_l(r^{2^l}) for l = 0, ..., logN - 1
        Fr[CONST_PROOF_SIZE_LOG_N] memory foldPosEvaluations = CommitmentSchemeLib.computeFoldPosEvaluations(
            tp.sumCheckUChallenges,
            mem.batchedEvaluation,
            proof.geminiAEvaluations,
            powers_of_evaluation_challenge,
            logN
        );

        // Compute the Shplonk constant term contributions from A₀(±r)
        mem.constantTermAccumulator = foldPosEvaluations[0] * mem.posInvertedDenominator;
        mem.constantTermAccumulator =
            mem.constantTermAccumulator + (proof.geminiAEvaluations[0] * tp.shplonkNu * mem.negInvertedDenominator);
        mem.batchingChallenge = tp.shplonkNu.sqr();

        // Compute Shplonk constant term contributions from Aₗ(±r^{2ˡ}) for l = 1, ..., m-1;
        // Compute scalar multipliers for each fold commitment
        for (uint256 i = 0; i < CONST_PROOF_SIZE_LOG_N - 1; ++i) {
            bool dummy_round = i >= (logN - 1);

            if (!dummy_round) {
                // Update inverted denominators
                mem.posInvertedDenominator = (tp.shplonkZ - powers_of_evaluation_challenge[i + 1]).invert();
                mem.negInvertedDenominator = (tp.shplonkZ + powers_of_evaluation_challenge[i + 1]).invert();

                // Compute the scalar multipliers for Aₗ(± r^{2ˡ}) and [Aₗ]
                mem.scalingFactorPos = mem.batchingChallenge * mem.posInvertedDenominator;
                mem.scalingFactorNeg = mem.batchingChallenge * tp.shplonkNu * mem.negInvertedDenominator;
                // [Aₗ] is multiplied by -v^{2l}/(z-r^{2^l}) - v^{2l+1} /(z+ r^{2^l})
                scalars[NUMBER_OF_ENTITIES + 1 + i] = mem.scalingFactorNeg.neg() + mem.scalingFactorPos.neg();

                // Accumulate the const term contribution given by
                // v^{2l} * Aₗ(r^{2ˡ}) /(z-r^{2^l}) + v^{2l+1} * Aₗ(-r^{2ˡ}) /(z+ r^{2^l})
                Fr accumContribution = mem.scalingFactorNeg * proof.geminiAEvaluations[i + 1];
                accumContribution = accumContribution + mem.scalingFactorPos * foldPosEvaluations[i + 1];
                mem.constantTermAccumulator = mem.constantTermAccumulator + accumContribution;
                // Update the running power of v
                mem.batchingChallenge = mem.batchingChallenge * tp.shplonkNu * tp.shplonkNu;
            }

            commitments[NUMBER_OF_ENTITIES + 1 + i] = convertProofPoint(proof.geminiFoldComms[i]);
        }

        // Finalise the batch opening claim
        commitments[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N] = Honk.G1Point({x: 1, y: 2});
        scalars[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N] = mem.constantTermAccumulator;

        Honk.G1Point memory quotient_commitment = convertProofPoint(proof.kzgQuotient);

        commitments[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 1] = quotient_commitment;
        scalars[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 1] = tp.shplonkZ; // evaluation challenge

        Honk.G1Point memory P_0 = batchMul(commitments, scalars);
        Honk.G1Point memory P_1 = negateInplace(quotient_commitment);

        return pairing(P_0, P_1);
    }

    // This implementation is the same as above with different constants
    function batchMul(
        Honk.G1Point[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 2] memory base,
        Fr[NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 2] memory scalars
    ) internal view returns (Honk.G1Point memory result) {
        uint256 limit = NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 2;
        assembly {
            let success := 0x01
            let free := mload(0x40)

            // Write the original into the accumulator
            // Load into memory for ecMUL, leave offset for eccAdd result
            // base is an array of pointers, so we have to dereference them
            mstore(add(free, 0x40), mload(mload(base)))
            mstore(add(free, 0x60), mload(add(0x20, mload(base))))
            // Add scalar
            mstore(add(free, 0x80), mload(scalars))
            success := and(success, staticcall(gas(), 7, add(free, 0x40), 0x60, free, 0x40))

            let count := 0x01
            for {} lt(count, limit) { count := add(count, 1) } {
                // Get loop offsets
                let base_base := add(base, mul(count, 0x20))
                let scalar_base := add(scalars, mul(count, 0x20))

                mstore(add(free, 0x40), mload(mload(base_base)))
                mstore(add(free, 0x60), mload(add(0x20, mload(base_base))))
                // Add scalar
                mstore(add(free, 0x80), mload(scalar_base))

                success := and(success, staticcall(gas(), 7, add(free, 0x40), 0x60, add(free, 0x40), 0x40))
                // accumulator = accumulator + accumulator_2
                success := and(success, staticcall(gas(), 6, free, 0x80, free, 0x40))
            }

            // Return the result - i hate this
            mstore(result, mload(free))
            mstore(add(result, 0x20), mload(add(free, 0x20)))
        }
    }
}

contract DepositHonkVerifier is BaseHonkVerifier(N, LOG_N, NUMBER_OF_PUBLIC_INPUTS) {
     function loadVerificationKey() internal pure override returns (Honk.VerificationKey memory) {
       return HonkVerificationKey.loadVerificationKey();
    }
}
