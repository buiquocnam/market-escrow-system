import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    role: 'buyer' | 'seller';
    sellerConfig?: {
        shopifyDomain: string;
        accessToken: string;
        shopName: string;
        webhookSecret?: string;
        webhookStatus?: 'pending' | 'verified' | 'error';
        webhookLastError?: string;
    };
    paymentWalletAddress: string;
    paymentWalletPrivateKey: string; // Encouraged to be encrypted in production
    payoutAddress?: string; // External wallet to receive funds
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
    sellerConfig: {
        shopifyDomain: { type: String },
        accessToken: { type: String },
        shopName: { type: String },
        webhookSecret: { type: String },
        webhookStatus: { type: String, enum: ['pending', 'verified', 'error'], default: 'pending' },
        webhookLastError: { type: String }
    },
    paymentWalletAddress: { type: String, required: true, unique: true },
    paymentWalletPrivateKey: { type: String, required: true },
    payoutAddress: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
