import mongoose, { Schema, Document } from 'mongoose';

/**
 * Category Model - Lưu trữ danh mục sản phẩm duy nhất của Marketplace
 * Được thu giữ tự động khi đồng bộ sản phẩm từ Shopify
 */
export interface ICategory extends Document {
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    slug: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    }
}, {
    timestamps: true
});

// Index phục vụ sort (unique: true đã tự động tạo index cho search)

export default mongoose.model<ICategory>('Category', CategorySchema);
