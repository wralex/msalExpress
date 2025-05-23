import express from 'express';
import path from 'path';
import fs from 'fs';
import {getMdMetaAndMd, convertMarkdownToHtml} from '../utils/markconvert';

const docPath = path.join(__dirname,'../../content/docs');

const getDocument = (req: express.Request, res: express.Response) => {
    if (!req.session.isAuthenticated) res.redirect('/auth/signin');
    else {
        let mdFile = path.join(docPath, `${(req.path ?? '/' as string).substring(1)}.md`);
        if(fs.existsSync(mdFile).valueOf()) {
            const mtAndMd = getMdMetaAndMd(mdFile);
            const html = convertMarkdownToHtml(mtAndMd.content ?? "_(no content found)_");
            res.render('pages/md/docs', {
                matter: mtAndMd.metadata,
                referrer: req.headers.referer,
                content: html
            });
        } else {
            res.render('pages/md/docs', {content: JSON.stringify('<h3>Document not found</h3>')});
        }
    }
}

export {
    getDocument
}