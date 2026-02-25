use std::hash::poseidon2;
mod merkle_tree;

fn main(
    // Public inputs
    root: pub Field,
    nullifier: pub Field,

    // Private inputs
    document: Field,
    secret: Field,
    merkle_proof: [Field; 20],
    is_even: [bool; 20],

) {

    // compute the commitment Poseidon(document,secret)
    let commitment: Field = poseidon2::Poseidon2::hash([document,secret], 2);

    // check that the commitment is in the Merkle tree
    let computed_root: Field = merkle_tree::compute_merkle_root(commitment, merkle_proof, is_even);
    assert(computed_root == root);

}