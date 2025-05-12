import path from 'path';
import * as envs from './utils/environmentals';

import session, {SessionOptions} from 'express-session';
const sessionConfig: SessionOptions = {
    secret: envs.EXPRESS_SESSION_SECRET ?? 'default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: false // Set to true if using HTTPS
    }
}

import helpers from './utils/HbsHelpers';
const hbsEngineConfig = {
    layoutsDir: path.join(__dirname, '../views/layouts'),
    partialsDir: path.join(__dirname, '../views/partials'),
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: helpers
}

import express from 'express';
const app = express();

if (envs.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy e.g. App Service
    sessionConfig.cookie!.secure = true; // serve secure cookies
}
app.use(session(sessionConfig));

import {engine} from 'express-handlebars';
app.engine('hbs', engine(hbsEngineConfig));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import * as middlewares from './middlewares';
app.use(middlewares.siteMiddleware);
app.use(middlewares.navMiddleware);
app.use(middlewares.socMiddleware);
app.use(middlewares.userMiddleware);

import routes from './routes';
app.use(routes);

import * as controller from './controllers/baseController';
app.get('/login', controller.loginFn); // Login Redirect
app.get('/logout', controller.logoutFn); // logout Redirect
app.use(controller.err404Fn); // catch 404 and forward to error handler
app.use(controller.errHandler);

app.listen(envs.PORT, () => console.log(`Listening on http://localhost:${envs.PORT}`));

export default app;