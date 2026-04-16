import express from 'express';
import * as authController from '../controllers/authController';

const router = express.Router();

router.post('/login', authController.loginWithEmail);

export default router;
