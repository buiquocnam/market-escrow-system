import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

/**
 * Gửi phản hồi thành công chuẩn hóa
 */
export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message
    });
};

/**
 * Gửi phản hồi lỗi chuẩn hóa
 */
export const sendError = (res: Response, error: string, statusCode = 500, message?: string) => {
    return res.status(statusCode).json({
        success: false,
        error,
        message
    });
};
