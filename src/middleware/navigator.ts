import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as yaml from 'yaml';

const filePath = path.join(__dirname, '../../content/data/navigation.yaml');

const navMiddleware = async (_req: Request, res: Response, next: NextFunction) =>{
    res.locals.partials ??= {};
    const data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
    const jsonData = yaml.parse(data);
    res.locals.partials.navContext = jsonData.navs;
    next();
}

export default navMiddleware;