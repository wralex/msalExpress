import express from 'express';
const router = express.Router();
export default router;
import * as baseController from '../controllers/baseControl';

router.use('/', require('./home').default);
router.use('/auth', require('./auth').default);
router.use('/user', require('./user').default);
router.use('/docs', require('./docs').default);

router.get('/login', baseController.loginFn); // Login Redirect
router.get('/logout', baseController.logoutFn); // logout Redirect
router.use(baseController.err404Fn); // catch 404 and forward to error handler
router.use(baseController.errHandler);