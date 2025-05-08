import express from 'express';
const router = express.Router();
export default router;
import isAuthenticated from 'middleware/ensureAuth';
import * as controller from 'controllers/userControl';

router.get('/profile', isAuthenticated, controller.profileFn);
