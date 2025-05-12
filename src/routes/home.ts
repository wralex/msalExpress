import express from 'express';
const router = express.Router();
export default router;
import * as controller from '../controllers/homeController';

router.get('/', controller.rootFn);
