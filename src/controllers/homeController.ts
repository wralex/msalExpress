import { Request, Response } from 'express';

export const rootFn = (req: Request, res: Response) => {
    res.render('pages/home', {
        title: 'Sample Web App',
        description: 'Sample Web App Description',
        username: req.session.account?.username ?? 'Guest',
        layout: 'main'
    });
}

export default rootFn;