import express from 'express';
import * as transactionController from '../controllers/transactionController';

const router = express.Router();

router.post('/sync-shopify', transactionController.verifyAndSyncShopify);

router.get('/history', transactionController.getTransactions);
router.post('/release', transactionController.releaseEscrowTransaction);

router.post('/sessions/create', transactionController.createCheckoutSession);
router.get('/sessions/active', transactionController.getActiveSession);
router.get('/sessions/status/:sessionId', transactionController.getSessionStatus);
router.post('/sessions/cancel', transactionController.cancelSession);

router.get('/settings', transactionController.getStoreSettings);
router.post('/settings/update', transactionController.updateStoreSettings);

export default router;
