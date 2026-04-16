import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreSettings extends Document {
    key: string; // e.g. "global_config"
    defaultPayoutAddress: string;
    autoReleaseDays: number;
    updatedAt: Date;
}

const StoreSettingsSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true, default: 'global_config' },
    defaultPayoutAddress: { type: String, required: true, default: '0x0000000000000000000000000000000000000000' },
    autoReleaseDays: { type: Number, default: 3 }
}, { timestamps: true });

export default mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);
