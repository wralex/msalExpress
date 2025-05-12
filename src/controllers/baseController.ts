import {Request, Response, NextFunction} from 'express';
import createError from 'http-errors';

export const loginFn = (req: any, res: Response) => {
    if (req.session.isAuthenticated) {
        return res.redirect('/'); // Redirect to home if already logged in
    }
    res.redirect('/auth/signin');
}

export const logoutFn = (req: any, res: Response) => {
    if (req.session.isAuthenticated) {
        req.session.destroy((err: any) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            res.redirect('/auth/signout'); // Redirect to login after logout
        });
    } else {
        res.redirect('/auth/signin'); // Redirect to login if not logged in
    }
}

export const err404Fn = (req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
}

export const errHandler = (err: any, req: Request, res: Response) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status ?? 500);
    res.render('/pages/error');
}
