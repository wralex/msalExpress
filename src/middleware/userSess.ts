import { Request, Response, NextFunction } from 'express';

const userMiddleware = (req:Request, res: Response, next: NextFunction) => {
    res.locals.partials ??= {};
    res.locals.partials.userContext = req.session ?? false;
    next();
}

export default userMiddleware;