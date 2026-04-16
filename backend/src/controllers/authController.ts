import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import walletService from '../services/walletService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const loginWithEmail = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return sendError(res, 'Email is required', 400);
        }

        // Find user
        let user = await User.findOne({ email });

        if (!user) {
            // Register new user (simulated)
            const role = 'buyer'; // Mặc định luôn là buyer cho người mới
            console.log(`[Auth] Registering new user for ${email} as buyer...`);
            
            if (!password) {
                return sendError(res, 'Password (mk) is required for new registration', 400);
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const { address, privateKey } = walletService.generateTempWallet();
            
            user = new User({
                email,
                password: hashedPassword,
                role,
                paymentWalletAddress: address,
                paymentWalletPrivateKey: privateKey
            });
            await user.save();
        } else {
            // Login existing user
            if (password && user.password) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return sendError(res, 'Mật khẩu (mk) không chính xác', 401);
                }
            } else if (password && !user.password) {
                // If user exists but has no password (legacy), we can either set one or allow transition
                console.log(`[Auth] Transitioning legacy user ${email} to password auth...`);
                user.password = await bcrypt.hash(password, 10);
            }

            // Sync role - Đã loại bỏ việc đổi role tại đây (chỉ đổi qua quy trình Onboarding)

            // SELF-HEALING: If existing user is missing wallet, generate it now
            if (!user.paymentWalletAddress || !user.paymentWalletPrivateKey) {
                console.log(`[Auth] Generating missing wallet for legacy user ${email}...`);
                const { address, privateKey } = walletService.generateTempWallet();
                user.paymentWalletAddress = address;
                user.paymentWalletPrivateKey = privateKey;
            }
            
            await user.save();
        }

        return sendSuccess(res, {
            userId: user._id,
            email: user.email,
            role: user.role,
            paymentWalletAddress: user.paymentWalletAddress,
            payoutAddress: user.payoutAddress || ""
        });
    } catch (error: any) {
        return sendError(res, error.message);
    }
};
