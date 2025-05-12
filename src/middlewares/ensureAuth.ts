import express from 'express';

// Extend the Session interface to include the isAuthenticated property
declare module 'express-session' {
    interface Session {
        isAuthenticated?: boolean;
    }
}

const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.isAuthenticated) {
        res.redirect('/auth/login');
    } else {
        next(); // User is authenticated, proceed to the next middleware/route
    }
}
export default isAuthenticated;