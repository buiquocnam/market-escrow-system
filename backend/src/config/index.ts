import dotenv from 'dotenv';
dotenv.config();

const config = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/market_escrow',
    SHOPIFY: {
        STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com',
        ADMIN_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN as string,
        WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET || 'your_shopify_secret_here',
    },
    RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
    ESCROW_CONTRACT_ADDRESS: '0x17cBE050b1E93510c410c5765f048997f7777777' // Sepolia deployment
} as const;

export default config;
