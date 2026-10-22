// src/utils/stampOnChain.js
import { JsonRpcProvider, Wallet } from "ethers";

// Initialise once — reuse across requests
const provider = new JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
);

const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider);

/**
 * Sends a 0-ETH transaction to Sepolia with the document's SHA-256 hash
 * encoded as calldata. Signed silently by the server wallet — no MetaMask.
 *
 * @param {string} fullHash  64-char hex SHA-256 (no 0x prefix)
 * @returns {Promise<{ txHash: string, etherscan: string }>}
 */
export async function stampOnChain(fullHash) {
    // Encode "DOCCHAIN:<hash>" as hex calldata
    const message = `DOCCHAIN:${fullHash}`;
    const dataHex = "0x" + Buffer.from(message, "utf8").toString("hex");

    const tx = await wallet.sendTransaction({
        to:    wallet.address, // send to self — no ETH moves
        value: 0n,
        data:  dataHex,
    });

    // Wait for 1 confirmation before returning
    await tx.wait(1);

    return {
        txHash:    tx.hash,
        etherscan: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    };
}
