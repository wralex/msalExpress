import { NextFunction, Response } from 'express';
import { GRAPH_ME_ENDPOINT } from 'utils/msalConfig';
import AxiosHelper from 'utils/AxiosHelper';
import * as myTypes from 'types';

export const profileFn = async (req: myTypes.EnhancedSessRequest, res: Response, next: NextFunction) => {
    try {
        const graphResponse = await AxiosHelper.callApiGet(GRAPH_ME_ENDPOINT, req.session.accessToken);
        res.render('pages/user/profile', { profile: graphResponse });
    } catch (error) {
        next(error);
    }
}