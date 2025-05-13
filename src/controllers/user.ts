import express from 'express';
import * as envs from '../utils/environmentals';
import AxiosHelper from '../utils/AxiosHelper';

declare module 'express-session' {
    interface SessionData {
        accessToken?: string;
    }
}

export const getProfile = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const graphResponse = await AxiosHelper.callApiGet(envs.GRAPH_ME_ENDPOINT, req.session.accessToken ?? '');
        res.render('pages/user/profile', { profile: graphResponse });
    } catch (error) {
        next(error);
    }
}

export const getId = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.render('pages/user/id', { idTokenClaims: req.session.account.idTokenClaims });
}
