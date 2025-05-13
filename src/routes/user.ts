import express from 'express';
const router = express.Router();
export default router;

import isAuthenticated from '../middlewares/ensureAuth';
import * as controller from '../controllers/user';

router.get('/profile', isAuthenticated, controller.getProfile);
router.get('/id', isAuthenticated, controller.getId);
