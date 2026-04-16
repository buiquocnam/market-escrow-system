import express from 'express';
import * as reviewController from '../controllers/reviewController';

const router = express.Router();

router.post('/', reviewController.createReview);
router.get('/', reviewController.getReviews);

export default router;
