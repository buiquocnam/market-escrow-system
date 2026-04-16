import mongoose from 'mongoose';
import config from './index';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error: any) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;
