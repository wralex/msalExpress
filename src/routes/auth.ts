import express from 'express';
const router = express.Router();
export default router;

import controller from '../controllers/authorization';
import * as envs from '../utils/environmentals';

router.get('/signin', controller.login({
    scopes: [],
    redirectUri: 'auth/redirect',
    successRedirect: '/'
}));
router.get('/login', controller.login({
    scopes: [],
    redirectUri: 'auth/redirect',
    successRedirect: '/'
}));

router.get('/signout', controller.logout({
    postLogoutRedirectUri: envs.POST_LOGOUT_REDIRECT_URI
}));
router.get('/logout', controller.logout({
    postLogoutRedirectUri: envs.POST_LOGOUT_REDIRECT_URI
}));

router.get('/acquireToken', controller.acquireToken({
    scopes: ['User.Read'],
    redirectUri: 'auth/redirect',
    successRedirect: '/user/profile'
}));

router.post('/redirect', controller.handleRedirect());
