import { JsonRpcProvider, Wallet, formatEther } from "ethers";

const INFURA_ID = process.env.INFURA_PROJECT_ID;
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

if (!INFURA_ID) {
    throw new Error("INFURA_PROJECT_ID is missing from .env");
}

if (!PRIVATE_KEY) {
    throw new Error("WALLET_PRIVATE_KEY is missing from .env");
}

const RPC_URL = `https://sepolia.infura.io/v3/${INFURA_ID}`;

console.log("\n========== DOCCHAIN CONFIG ==========");
console.log("RPC URL:", RPC_URL);
console.log("Wallet Key Present:", !!PRIVATE_KEY);
console.log("=====================================\n");

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

export async function stampOnChain(fullHash) {
    try {
        console.log("\n========== STAMP REQUEST ==========");
        console.log("Hash:", fullHash);

        const network = await provider.getNetwork();
        console.log("Network:", network.name);
        console.log("Chain ID:", network.chainId.toString());

        const balance = await provider.getBalance(wallet.address);
        console.log("Wallet:", wallet.address);
        console.log("Balance:", formatEther(balance), "ETH");

        if (balance === 0n) {
            throw new Error(
                "Wallet has 0 Sepolia ETH. Get test ETH before stamping."
            );
        }

        const message = `DOCCHAIN:${fullHash}`;
        const data = "0x" + Buffer.from(message).toString("hex");

        const tx = await wallet.sendTransaction({
            to: wallet.address,
            value: 0n,
            data,
        });

        console.log("Transaction Hash:", tx.hash);

        await tx.wait();

        console.log("Transaction Confirmed");

        return {
            txHash: tx.hash,
            etherscan: `https://sepolia.etherscan.io/tx/${tx.hash}`,
        };
    } catch (err) {
        console.error("\n========== BLOCKCHAIN ERROR ==========");
        console.error(err);
        console.error("Message:", err.message);
        console.error("Code:", err.code);
        console.error("======================================");

        throw err;
    }
}