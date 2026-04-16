import { ethers } from 'ethers';

/**
 * Wallet Service - Generates temporary addresses for order deposits.
 */
class WalletService {
    /**
     * Generate a new temporary wallet for a checkout session.
     */
    generateTempWallet() {
        const wallet = ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    }
}

export default new WalletService();
