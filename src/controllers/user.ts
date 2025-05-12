import express from 'express';
import { GRAPH_ME_ENDPOINT } from '../utils/msalConfig';
import AxiosHelper from '../utils/AxiosHelper';

declare module 'express-session' {
    interface SessionData {
        accessToken?: string;
    }
}

const getProfile = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const graphResponse = await AxiosHelper.callApiGet(GRAPH_ME_ENDPOINT, req.session.accessToken ?? '');
        res.render('pages/user/profile', { profile: graphResponse });
    } catch (error) {
        next(error);
    }
}

export {
    getProfile
}