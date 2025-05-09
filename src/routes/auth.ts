import express from 'express';
const router = express.Router();
export default router;
import * as config from '../utils/msalConfig';
import authController from '../controllers/authControl';
import isAuthenticated from '../middleware/ensureAuth';

router.get('/signin', authController.login({
    scopes: ['User.Read'],
    redirectUri: config.REDIRECT_URI,
    successRedirect: '/'
}));

router.get('/login', authController.login({
    scopes: ['User.Read'],
    redirectUri: config.REDIRECT_URI,
    successRedirect: '/'
}));

router.get('/signout', authController.logout({
    postLogoutRedirectUri: config.POST_LOGOUT_REDIRECT_URI,
    successRedirect: '/'
}));

router.get('/logout', authController.logout({
    postLogoutRedirectUri: config.POST_LOGOUT_REDIRECT_URI,
    successRedirect: '/'
}));

router.post('/redirect', authController.handleRedirect());

router.get('/acquireToken', isAuthenticated, authController.acquireToken({
    scopes: ['User.Read'],
    redirectUri: config.REDIRECT_URI,
    successRedirect: '/user/profile'
}));
