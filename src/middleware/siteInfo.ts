import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const filePath = path.join(__dirname, '../../config/site.json');
const data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
const jsonData = JSON.parse(data);

const siteMiddleware = async (_req: Request, res: Response, next: NextFunction) =>{
    res.locals.partials ??= {};
    if(jsonData.socials) delete jsonData.socials;
    res.locals.partials.siteContext = jsonData;
    next();
}

export default siteMiddleware;