import mongoose, { Schema, Document } from 'mongoose';
import { IEscrow, EscrowStatus } from '@shared/types';

export interface IEscrowDocument extends Omit<IEscrow, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const escrowSchema = new Schema<IEscrowDocument>({
    txHash: {
        type: String,
        required: true,
        unique: true
    },
    buyerAddress: {
        type: String,
        required: true
    },
    sellerAddress: {
        type: String,
        required: true
    },
    productTitle: {
        type: String,
        required: true
    },
    amountEth: {
        type: Number,
        required: true
    },
    priceUsd: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(EscrowStatus),
        default: EscrowStatus.PENDING
    },
    shopifyOrderId: {
        type: String,
        default: null
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model<IEscrowDocument>('Escrow', escrowSchema);
