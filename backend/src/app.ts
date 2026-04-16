import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import shopifyVerifier from './middlewares/shopifyVerifier';
import shopifyRoutes from './routes/shopifyRoutes';
import transactionRoutes from './routes/transactionRoutes';
import authRoutes from './routes/authRoutes';
import reviewRoutes from './routes/reviewRoutes';

const app = express();

app.use(cors());

// ⚡ QUAN TRỌNG: Giữ nguyên body thô (Raw Buffer) cho các route Webhook của Shopify
// để verify HMAC chính xác. Phải đặt TRƯỚC express.json()
app.use('/api/shopify/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());


// Setup Routes
app.use('/api/shopify', shopifyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);

// Error Handling block
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Xảy ra lỗi rùi!');
});

export default app;
