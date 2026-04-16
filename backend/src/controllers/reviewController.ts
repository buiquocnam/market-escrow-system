import { Request, Response } from 'express';
import Review from '../models/Review';
import CheckoutSession, { SessionStatus } from '../models/CheckoutSession';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * Thêm một đánh giá mới
 */
export const createReview = async (req: Request, res: Response) => {
    try {
        const { productId, shopName, rating, comment, userId, userName } = req.body;

        if (!productId || !rating || !comment || !userId) {
            return sendError(res, "Missing required fields", 400);
        }

        // Kiểm tra xem user đã mua hàng thật chưa (đã thanh toán hoặc hoàn tất)
        const order = await CheckoutSession.findOne({
            userId,
            productTitle: { $exists: true }, // Logic đơn giản: dựa trên history session
            status: { $in: [SessionStatus.PAID, SessionStatus.COMPLETED] }
        });

        const newReview = new Review({
            productId,
            userId,
            userName,
            shopName,
            rating,
            comment,
            isVerifiedPurchase: !!order
        });

        await newReview.save();
        return sendSuccess(res, newReview, "Đánh giá của bạn đã được ghi lại!");
    } catch (err: any) {
        console.error("Create Review Error:", err.message);
        return sendError(res, err.message);
    }
};

/**
 * Lấy danh sách đánh giá theo Product hoặc Shop
 */
export const getReviews = async (req: Request, res: Response) => {
    try {
        const { productId, shopName } = req.query;
        let query: any = {};
        
        if (productId) query.productId = productId;
        if (shopName) query.shopName = shopName;

        const reviews = await Review.find(query).sort({ createdAt: -1 });
        return sendSuccess(res, reviews);
    } catch (err: any) {
        return sendError(res, err.message);
    }
};
