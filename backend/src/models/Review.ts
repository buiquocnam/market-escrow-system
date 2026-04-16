import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    productId: string; // Shopify GraphQL ID or handle
    userId: mongoose.Types.ObjectId;
    userName: string;
    shopName: string;
    rating: number; // 1 to 5
    comment: string;
    isVerifiedPurchase: boolean;
    createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
    productId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    shopName: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isVerifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
