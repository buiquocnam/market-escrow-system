import express from 'express';
import * as shopifyController from '../controllers/shopifyController';
import shopifyVerifier from '../middlewares/shopifyVerifier';

const router = express.Router();

// Webhooks (cần xác thực HMAC và dùng raw body)
router.post('/webhook/product_create', shopifyVerifier, shopifyController.handleProductCreate);
router.post('/webhook/product_delete', shopifyVerifier, shopifyController.handleProductDelete);

// Các route khác (dùng express.json() bình thường)
router.get('/products', shopifyController.getProducts);
router.post('/sync', shopifyController.syncProducts);
router.get('/categories', shopifyController.getCategories);
router.get('/shop/:shopName', shopifyController.getShopDetails);
router.post('/update-seller-config', shopifyController.updateSellerConfig);
router.post('/test-connection', shopifyController.testConnection);
router.post('/verify-webhook-secret', shopifyController.verifyWebhookLoop);

// Webhook management (debug & maintenance)
router.post('/webhooks/register', shopifyController.registerWebhooks);
router.get('/webhooks/list', shopifyController.listWebhooks);

export default router;
