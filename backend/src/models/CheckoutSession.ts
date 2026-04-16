import mongoose, { Schema, Document } from 'mongoose';

export enum SessionStatus {
    WAITING = 'WAITING',
    PAID = 'PAID',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED'
}

export interface ICheckoutSession extends Document {
    sessionId: string;
    productTitle: string;
    productHandle?: string; // Shopify product handle — dùng để link về trang sản phẩm
    priceUsd: number;
    amountEth: number;
    depositAddress: string;
    sellerAddress: string; // The vendor who will receive the funds
    privateKey: string;
    userId: string;        // ID of the buyer (User model)
    status: SessionStatus;
    txHash?: string;
    escrowId?: number; // Corresponding ID in Smart Contract
    paidAt?: Date;      // When payment was detected
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CheckoutSessionSchema: Schema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    productTitle: { type: String, required: true },
    productHandle: { type: String }, // optional — link về product detail page
    priceUsd: { type: Number, required: true },
    amountEth: { type: Number, required: true },
    depositAddress: { type: String, required: true, index: true },
    sellerAddress: { type: String, required: true },
    privateKey: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { 
        type: String, 
        enum: Object.values(SessionStatus), 
        default: SessionStatus.WAITING 
    },
    txHash: { type: String },
    escrowId: { type: Number },
    paidAt: { type: Date },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Auto-expire after 30 mins
CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ICheckoutSession>('CheckoutSession', CheckoutSessionSchema);
