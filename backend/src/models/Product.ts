import mongoose, { Schema, Document } from 'mongoose';

export interface IProductDocument extends Document {
    shopifyId: string;
    title: string;
    handle: string;
    vendor: string;
    priceUsd: number;
    imageSrc: string;
    category: string;
    tags: string[];
    descriptionHtml?: string;
    shopName: string;
    sellerId: mongoose.Types.ObjectId;
    lastSyncedAt: Date;
}

const ProductSchema: Schema = new Schema({
    shopifyId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    handle: { type: String, required: true },
    vendor: { type: String },
    priceUsd: { type: Number, required: true },
    imageSrc: { type: String },
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    descriptionHtml: { type: String },
    shopName: { type: String, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastSyncedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Optimized text index for global search across multiple fields
ProductSchema.index({ 
    title: 'text', 
    category: 'text', 
    tags: 'text',
    shopName: 'text'
}, {
    weights: {
        title: 10,
        category: 3,
        shopName: 3,
        tags: 1
    },
    name: "ProductSearchIndex"
});

ProductSchema.index({ priceUsd: 1 });
ProductSchema.index({ sellerId: 1 });

export default mongoose.model<IProductDocument>('Product', ProductSchema);
