import express from 'express';
const router = express.Router();
export default router;
import * as controller from 'controllers/homeControl';

router.get('/', controller.rootFn);
