import { Response, NextFunction } from 'express';
import { EnhancedSessRequest } from '../types';

const userMiddleware = async (req: EnhancedSessRequest, res: Response, next: NextFunction) =>{
    res.locals.partials ??= {};
    res.locals.partials.userContext = req.session ?? false;
    next();
}

export default userMiddleware;