import path from 'path';

const appSrcDirectory = path.resolve(__dirname, '../src');

// Mock 'path'
const mockPathJoinImpl = jest.fn((...args: string[]) => {
    // Simulate path.join behavior for testing purposes, normalizing to forward slashes
    return path.posix.join(...args);
});
jest.mock('path', () => {
    const originalPath = jest.requireActual('path');
    return {
        ...originalPath,
        join: (...args: string[]) => mockPathJoinImpl(...args),
        // Ensure __dirname resolves correctly within the mocked module context if needed elsewhere,
        // but for app.ts, its own __dirname will be correct.
    };
});

// Mock 'express-session'
let capturedSessionConfig: any;
const mockSessionImpl = jest.fn(config => {
    capturedSessionConfig = config;
    return 'sessionMiddlewareInstance'; // A unique identifier for the middleware
});
jest.mock('express-session', () => ({
    __esModule: true,
    default: mockSessionImpl,
}));

// Mock 'express-handlebars'
let capturedHbsEngineConfig: any;
const mockHbsEngineImpl = jest.fn(config => {
    capturedHbsEngineConfig = config;
    return 'hbsEngineInstance'; // A unique identifier for the engine function
});
jest.mock('express-handlebars', () => ({
    __esModule: true,
    engine: mockHbsEngineImpl,
}));

// Mock 'express'
const mockAppInstance = {
    set: jest.fn(),
    use: jest.fn(),
    engine: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((_port, callback) => { // Renamed port to _port as it's not directly used in this mock
        if (callback) callback(); // Invoke the callback to simulate server start
        return { close: jest.fn() }; // Mock server object
    }),
};
const mockExpressImpl = jest.fn(() => mockAppInstance);
const mockExpressStaticImpl = jest.fn((filePath) => `staticMiddleware(${filePath})`);
const mockExpressJsonImpl = jest.fn(() => 'jsonMiddleware');
const mockExpressUrlencodedImpl = jest.fn((options) => `urlencodedMiddleware(${JSON.stringify(options)})`);

jest.mock('express', () => ({
    __esModule: true,
    default: mockExpressImpl,
    static: mockExpressStaticImpl,
    json: mockExpressJsonImpl,
    urlencoded: mockExpressUrlencodedImpl,
}));

const mockHbsHelpersContent = { hbsHelper1: 'helperFunc1' };
jest.mock('../src/utils/HbsHelpers', () => ({
    __esModule: true,
    default: mockHbsHelpersContent,
}));

const mockMiddlewaresContent = {
    siteMiddleware: 'siteMiddlewareContent',
    navMiddleware: 'navMiddlewareContent',
    socMiddleware: 'socMiddlewareContent',
    userMiddleware: 'userMiddlewareContent',
};
jest.mock('../src/middlewares', () => mockMiddlewaresContent);

const mockRoutesContent = 'routesContent';
jest.mock('../src/routes', () => ({
    __esModule: true,
    default: mockRoutesContent,
}));

const mockControllerContent = {
    loginFn: 'loginFnContent',
    logoutFn: 'logoutFnContent',
    err404Fn: 'err404FnContent',
    errHandler: 'errHandlerFnContent',
};
jest.mock('../src/controllers/baseController', () => mockControllerContent);

let mockConsoleLog: jest.SpyInstance;

describe('app.ts', () => {
    let importedApp: any; // The imported app module's default export

    // Helper to load app.ts with specific environment variables
    const loadAppWithEnvs = async (mockEnvs: any) => {
        jest.mock('../src/utils/environmentals', () => ({
            EXPRESS_SESSION_SECRET: undefined, // Default if not overridden
            NODE_ENV: 'development',          // Default if not overridden
            PORT: 3000,                       // Default if not overridden
            ...mockEnvs,
        }));
        const appModule = await import('../src/app');
        return appModule.default;
    };

    beforeEach(() => {
        jest.resetModules(); // Crucial for re-importing app.ts with fresh mocks/env
        jest.clearAllMocks(); // Clear mock call history

        capturedSessionConfig = undefined;
        capturedHbsEngineConfig = undefined;

        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        mockConsoleLog.mockRestore();
    });

    describe('Development environment', () => {
        beforeEach(async () => {
            importedApp = await loadAppWithEnvs({ NODE_ENV: 'development', EXPRESS_SESSION_SECRET: 'dev_secret', PORT: 3001 });
        });

        test('should configure session with development settings', () => {
            expect(mockSessionImpl).toHaveBeenCalledTimes(1);
            expect(capturedSessionConfig.secret).toBe('dev_secret');
            expect(capturedSessionConfig.resave).toBe(false);
            expect(capturedSessionConfig.saveUninitialized).toBe(false);
            expect(capturedSessionConfig.cookie.maxAge).toBe(1000 * 60 * 60 * 24);
            expect(capturedSessionConfig.cookie.secure).toBe(false);
            expect(mockAppInstance.use).toHaveBeenCalledWith('sessionMiddlewareInstance');
        });

        test('should not set "trust proxy"', () => {
            expect(mockAppInstance.set).not.toHaveBeenCalledWith('trust proxy', 1);
        });

        test('should configure Handlebars engine', () => {
            expect(mockHbsEngineImpl).toHaveBeenCalledTimes(1);
            const expectedLayoutsDir = `views/layouts`.replace(/\\/g, '/');
            const expectedPartialsDir = `views/partials`.replace(/\\/g, '/');
            const expectedViewsDir = `views`.replace(/\\/g, '/');

            expect(mockPathJoinImpl).toHaveBeenCalledWith(appSrcDirectory, '../views/layouts');
            expect(mockPathJoinImpl).toHaveBeenCalledWith(appSrcDirectory, '../views/partials');
            expect(mockPathJoinImpl).toHaveBeenCalledWith(appSrcDirectory, '../views');

            expect(capturedHbsEngineConfig.layoutsDir).toBe(expectedLayoutsDir);
            expect(capturedHbsEngineConfig.partialsDir).toBe(expectedPartialsDir);
            expect(capturedHbsEngineConfig.extname).toBe('.hbs');
            expect(capturedHbsEngineConfig.defaultLayout).toBe('main');
            expect(capturedHbsEngineConfig.helpers).toBe(mockHbsHelpersContent);

            expect(mockAppInstance.engine).toHaveBeenCalledWith('hbs', 'hbsEngineInstance');
            expect(mockAppInstance.set).toHaveBeenCalledWith('view engine', 'hbs');
            expect(mockAppInstance.set).toHaveBeenCalledWith('views', expectedViewsDir);
        });

        test('should setup standard middlewares', () => {
            expect(mockExpressStaticImpl).toHaveBeenCalledWith('public');
            expect(mockAppInstance.use).toHaveBeenCalledWith(mockExpressStaticImpl('public'));
            expect(mockExpressJsonImpl).toHaveBeenCalledTimes(1);
            expect(mockAppInstance.use).toHaveBeenCalledWith(mockExpressJsonImpl());
            expect(mockExpressUrlencodedImpl).toHaveBeenCalledWith({ extended: true });
            expect(mockAppInstance.use).toHaveBeenCalledWith(mockExpressUrlencodedImpl({ extended: true }));
        });

        test('should setup custom middlewares, routes, and error handlers in order', () => {
            const useCalls = mockAppInstance.use.mock.calls.map(call => call[0]);

            expect(useCalls).toContain(mockMiddlewaresContent.siteMiddleware);
            expect(useCalls).toContain(mockMiddlewaresContent.navMiddleware);
            expect(useCalls).toContain(mockMiddlewaresContent.socMiddleware);
            expect(useCalls).toContain(mockMiddlewaresContent.userMiddleware);
            expect(useCalls).toContain(mockRoutesContent);
            expect(useCalls).toContain(mockControllerContent.err404Fn);
            expect(useCalls).toContain(mockControllerContent.errHandler);

            // Check order of key middlewares
            expect(useCalls.indexOf('sessionMiddlewareInstance'))
                .toBeLessThan(useCalls.indexOf(mockMiddlewaresContent.siteMiddleware));
            expect(useCalls.indexOf(mockMiddlewaresContent.userMiddleware))
                .toBeLessThan(useCalls.indexOf(mockRoutesContent));
            expect(useCalls.indexOf(mockRoutesContent))
                .toBeLessThan(useCalls.indexOf(mockControllerContent.err404Fn));
            expect(useCalls.indexOf(mockControllerContent.err404Fn))
                .toBeLessThan(useCalls.indexOf(mockControllerContent.errHandler));
        });

        test('should setup base controller GET routes', () => {
            expect(mockAppInstance.get).toHaveBeenCalledWith('/login', mockControllerContent.loginFn);
            expect(mockAppInstance.get).toHaveBeenCalledWith('/logout', mockControllerContent.logoutFn);
        });

        test('should start listening on the configured port and log message', () => {
            expect(mockAppInstance.listen).toHaveBeenCalledWith(3001, expect.any(Function));
            expect(mockConsoleLog).toHaveBeenCalledWith('Listening on http://localhost:3001');
        });

        test('should export the app instance', () => {
            expect(importedApp).toBe(mockAppInstance);
        });
    });

    describe('Production environment', () => {
        beforeEach(async () => {
            importedApp = await loadAppWithEnvs({ NODE_ENV: 'production', EXPRESS_SESSION_SECRET: 'prod_secret', PORT: 8080 });
        });

        test('should set "trust proxy"', () => {
            expect(mockAppInstance.set).toHaveBeenCalledWith('trust proxy', 1);
        });

        test('should configure session with secure cookie for production', () => {
            expect(mockSessionImpl).toHaveBeenCalledTimes(1);
            expect(capturedSessionConfig.secret).toBe('prod_secret');
            expect(capturedSessionConfig.cookie.secure).toBe(true);
            expect(mockAppInstance.use).toHaveBeenCalledWith('sessionMiddlewareInstance');
        });

        test('should start listening on the production port and log message', () => {
            expect(mockAppInstance.listen).toHaveBeenCalledWith(8080, expect.any(Function));
            expect(mockConsoleLog).toHaveBeenCalledWith('Listening on http://localhost:8080');
        });
    });

    describe('Session secret configuration', () => {
        test('should use default session secret if EXPRESS_SESSION_SECRET is undefined', async () => {
            await loadAppWithEnvs({ NODE_ENV: 'development', EXPRESS_SESSION_SECRET: undefined });
            expect(mockSessionImpl).toHaveBeenCalledTimes(1);
            expect(capturedSessionConfig.secret).toBe('default_secret_key');
        });

        test('should use provided session secret if EXPRESS_SESSION_SECRET is an empty string', async () => {
            // According to `?? 'default_secret_key'`, an empty string is a valid secret.
            await loadAppWithEnvs({ NODE_ENV: 'development', EXPRESS_SESSION_SECRET: '' });
            expect(mockSessionImpl).toHaveBeenCalledTimes(1);
            expect(capturedSessionConfig.secret).toBe('');
        });
    });
});