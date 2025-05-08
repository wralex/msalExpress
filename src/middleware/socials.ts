import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const filePath = path.join(__dirname, '../../config/site.json');
const data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
const jsonData = JSON.parse(data);

const socMiddleware = async (_req: Request, res: Response, next: NextFunction) =>{
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.socialContext = jsonData.socials;
    next();
}

export default socMiddleware;