import express from 'express';
import session, {SessionOptions} from 'express-session';
import path from 'path';
import {engine} from 'express-handlebars';
import hbsHelpers from './utils/HbsHelpers';
import routes from './routes';
import navMiddleware from './middleware/navigator';
import socMiddleware from './middleware/socials';
import siteMiddleware from './middleware/siteInfo';
import dotenv from '@dotenvx/dotenvx';
dotenv.config();

const SERVER_PORT = process.env.PORT || 3080;

const sessionConfig: SessionOptions = {
    secret: process.env.EXPRESS_SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: false // Set to true if using HTTPS
    }
}

const hbsEngineConfig = {
    layoutsDir: path.join(__dirname, '../views/layouts'),
    partialsDir: path.join(__dirname, '../views/partials'),
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: hbsHelpers
}

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy e.g. App Service
    sessionConfig.cookie!.secure = true; // serve secure cookies
}
app.use(session(sessionConfig));

app.engine('hbs', engine(hbsEngineConfig));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(siteMiddleware);
app.use(navMiddleware);
app.use(socMiddleware);
app.use(routes);

app.listen(SERVER_PORT, () => console.log(`Listening on http://localhost:${SERVER_PORT}`));
