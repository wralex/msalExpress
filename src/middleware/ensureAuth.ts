import { Response, NextFunction } from 'express';
import { EnhancedSessRequest } from "../types";

const isAuthenticated = (req: EnhancedSessRequest, res: Response, next: NextFunction) => {
    if (!req.session.isAuthenticated) {
        res.redirect('/auth/login');
    } else {
        next(); // User is authenticated, proceed to the next middleware/route
    }
}
export default isAuthenticated;