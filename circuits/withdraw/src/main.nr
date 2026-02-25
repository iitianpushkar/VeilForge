use std::hash::poseidon2;
mod merkle_tree;

fn main(
    // Public inputs
    toToken: pub Field,
    dstEid: pub Field,
    slippageBps: pub Field,
    
    root: pub Field,
    nullifier_hash: pub Field,
    recipient: pub Field,
    withdraw_amount: pub u128,
    new_nullifier_hash: pub Field,

    // Private inputs
    nullifier: Field,
    secret: Field,
    merkle_proof: [Field; 20],
    is_even: [bool; 20],
    balance: u128,
    new_nullifier: Field,
    new_secret: Field,

) -> pub Field {

    // compute the commitment Poseidon(nullifier,secret,balance)
    let commitment: Field = poseidon2::Poseidon2::hash([nullifier,secret,balance.into()], 3);

    // check that the nullifier matches the nullifier hash
    let computed_nullifier_hash: Field = poseidon2::Poseidon2::hash([nullifier], 1);
    assert(computed_nullifier_hash == nullifier_hash);

    // check that the commitment is in the Merkle tree
    let computed_root: Field = merkle_tree::compute_merkle_root(commitment, merkle_proof, is_even);
    assert(computed_root == root);

    // check that the withdraw amount is less than or equal to the value
    assert(withdraw_amount <= balance);

    // compute the new commitment Poseidon(value - withdraw_amount, new_nullifier, new_secret)
    let new_commitment: Field = poseidon2::Poseidon2::hash([new_nullifier, new_secret,(balance - withdraw_amount).into()], 3);

    // check that the new nullifier matches the new nullifier hash
    let new_computed_nullifier_hash: Field = poseidon2::Poseidon2::hash([new_nullifier], 1);
    assert(new_computed_nullifier_hash == new_nullifier_hash);


    //  Return public output
    new_commitment
}