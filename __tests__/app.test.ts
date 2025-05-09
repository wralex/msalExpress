// Mock dependencies at the top level. These mocks will be used by app.ts when it's imported.
const mockAppInstance = {
    use: jest.fn(),
    set: jest.fn(),
    engine: jest.fn(),
    listen: jest.fn((port, cb) => { if (cb) { cb(); } return {} as any; }), // Mock listen behavior
};
const mockExpressModule = jest.fn(() => mockAppInstance);
// Mock static methods/properties on the express module
(mockExpressModule as any).json = jest.fn(() => 'jsonMiddleware');
(mockExpressModule as any).urlencoded = jest.fn(() => 'urlencodedMiddleware');
(mockExpressModule as any).static = jest.fn(() => 'staticMiddleware');
jest.mock('express', () => mockExpressModule);

const mockSessionMiddlewareFn = jest.fn(() => 'sessionMiddlewareInstance');
jest.mock('express-session', () => mockSessionMiddlewareFn);

const mockHbsEngineInstanceFn = jest.fn(() => 'hbsEngineInstance');
jest.mock('express-handlebars', () => ({ engine: mockHbsEngineInstanceFn }));

jest.mock('../src/utils/HbsHelpers', () => ({ default: 'mocked-hbsHelpers' })); // Assuming HbsHelpers is a default export
jest.mock('../src/middleware/navigator', () => 'navMiddlewareFunction'); // Assuming default export
jest.mock('../src/middleware/socials', () => 'socMiddlewareFunction');   // Assuming default export
jest.mock('../src/middleware/siteInfo', () => 'siteMiddlewareFunction'); // Assuming default export
jest.mock('../src/routes', () => 'routesFunction');                     // Assuming default export

// Mock dotenvx/dotenvx
const mockDotenvConfig = jest.fn();
jest.mock('@dotenvx/dotenvx', () => ({
    config: mockDotenvConfig,
}));

import hbsHelpers from '../src/utils/HbsHelpers';
import path from 'path'; // Actual import for use in tests

describe('App Setup', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let consoleLogSpy: jest.SpyInstance;
    let app: any; // To hold the (mocked) app instance
    
    // Helper function to load (or reload) app.ts by requiring it.
    // This will cause app.ts to re-evaluate with current process.env and mocks.
    const loadApp = () => {
        jest.resetModules(); // Crucial for re-evaluating app.ts

        // Clear mock function call histories from previous loads within the same test file
        // (though beforeEach also does this, being explicit here for clarity with resetModules)
        mockAppInstance.use.mockClear();
        mockAppInstance.set.mockClear();
        mockAppInstance.engine.mockClear();
        mockAppInstance.listen.mockClear();
        (mockExpressModule as any).json.mockClear();
        (mockExpressModule as any).urlencoded.mockClear();
        (mockExpressModule as any).static.mockClear();
        mockSessionMiddlewareFn.mockClear();
        mockHbsEngineInstanceFn.mockClear();
        mockDotenvConfig.mockClear();

        // Re-import app.ts. This will execute the file.
        // The default export of app.ts is the express app instance.
        // Due to our mock of 'express', this will be mockAppInstance.
        const appModule = require('../src/app');
        return appModule.default; // This should be our mockAppInstance
    };

    beforeAll(() => {
        // Spy on console.log once for all tests in this suite
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    beforeEach(() => {
        // Store and reset environment variables before each test
        originalEnv = { ...process.env };
        delete process.env.PORT;
        delete process.env.EXPRESS_SESSION_SECRET;
        process.env.NODE_ENV = 'test'; // Default to 'test' environment

        // Clear all mock function call histories before each test
        mockAppInstance.use.mockClear();
        mockAppInstance.set.mockClear();
        mockAppInstance.engine.mockClear();
        mockAppInstance.listen.mockClear();
        (mockExpressModule as any).json.mockClear();
        (mockExpressModule as any).urlencoded.mockClear();
        (mockExpressModule as any).static.mockClear();
        mockSessionMiddlewareFn.mockClear();
        mockHbsEngineInstanceFn.mockClear();
        mockDotenvConfig.mockClear();
    });

    afterEach(() => {
        process.env = originalEnv; // Restore original process.env
    });

    afterAll(() => {
        consoleLogSpy.mockRestore(); // Restore console.log
    });

    it('should call dotenv.config() when app module is loaded', () => {
        loadApp(); // Load app.ts to trigger its top-level execution
        expect(mockDotenvConfig).toHaveBeenCalledTimes(1);
    });

    describe('Server Port and Listen', () => {
        it('should listen on default port 3080 if PORT env var is not set', () => {
            delete process.env.PORT;
            app = loadApp(); // app is our mockAppInstance
            expect(app.listen).toHaveBeenCalledWith(3080, expect.any(Function));
            
            // Execute the callback passed to listen to check console.log
            const listenCallback = app.listen.mock.calls[0][1];
            listenCallback();
            expect(consoleLogSpy).toHaveBeenCalledWith('Listening on http://localhost:3080');
        });

        it('should listen on PORT env var if set', () => {
            process.env.PORT = '8080';
            app = loadApp();
            expect(app.listen).toHaveBeenCalledWith('8080', expect.any(Function));

            const listenCallback = app.listen.mock.calls[0][1];
            listenCallback();
            expect(consoleLogSpy).toHaveBeenCalledWith('Listening on http://localhost:8080');
        });
    });

    describe('Session Configuration', () => {
        it('should configure session with default secret if EXPRESS_SESSION_SECRET is not set', () => {
            delete process.env.EXPRESS_SESSION_SECRET;
            app = loadApp();
            
            expect(mockSessionMiddlewareFn).toHaveBeenCalledWith(expect.objectContaining({
                secret: 'default_secret_key',
                resave: false,
                saveUninitialized: false,
                cookie: {
                    maxAge: 1000 * 60 * 60 * 24, // 1 day
                    secure: false,
                },
            }));
            expect(app.use).toHaveBeenCalledWith('sessionMiddlewareInstance'); // The return value of the session mock
        });

        it('should configure session with EXPRESS_SESSION_SECRET if set', () => {
            process.env.EXPRESS_SESSION_SECRET = 'test_secret_key_from_env';
            app = loadApp();
            
            expect(mockSessionMiddlewareFn).toHaveBeenCalledWith(expect.objectContaining({
                secret: 'test_secret_key_from_env',
            }));
        });
    });

    describe('Production Configuration', () => {
        beforeEach(() => {
            // Set NODE_ENV to production for tests in this block
            process.env.NODE_ENV = 'production';
        });

        it('should set "trust proxy" to 1 in production', () => {
            app = loadApp();
            expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
        });

        it('should set session cookie.secure to true in production', () => {
            app = loadApp();
            // The sessionConfig object is modified in app.ts before session() is called
            expect(mockSessionMiddlewareFn).toHaveBeenCalledWith(expect.objectContaining({
                cookie: expect.objectContaining({
                    secure: true, // This should be true in production
                }),
            }));
        });
    });

    describe('Handlebars Configuration', () => {
        it('should configure handlebars engine correctly', () => {
            app = loadApp();

            // __dirname in the test file (src/) is the same as __dirname in app.ts (src/)
            const expectedViewsDir = path.join(__dirname, '../views');
            const expectedLayoutsDir = path.join(expectedViewsDir, 'layouts');
            const expectedPartialsDir = path.join(expectedViewsDir, 'partials');

            const expectedHbsConfig = {
                layoutsDir: expectedLayoutsDir,
                partialsDir: expectedPartialsDir,
                extname: '.hbs',
                defaultLayout: 'main',
                helpers: hbsHelpers, // This comes from the mock of ./utils/HbsHelpers
            };

            expect(mockHbsEngineInstanceFn).toHaveBeenCalledWith(expectedHbsConfig);
            expect(app.engine).toHaveBeenCalledWith('hbs', 'hbsEngineInstance'); // Return value of engine() mock
            expect(app.set).toHaveBeenCalledWith('view engine', 'hbs');
            expect(app.set).toHaveBeenCalledWith('views', expectedViewsDir);
        });
    });

    describe('Middleware Usage', () => {
        // Load app once for this suite of middleware tests, or in each 'it' if env changes affect order/presence
        beforeEach(() => {
            app = loadApp();
        });

        it('should use express.static for "public" directory', () => {
            expect((mockExpressModule as any).static).toHaveBeenCalledWith('public');
            expect(app.use).toHaveBeenCalledWith('staticMiddleware'); // Return value of express.static mock
        });

        it('should use express.json middleware', () => {
            expect((mockExpressModule as any).json).toHaveBeenCalled();
            expect(app.use).toHaveBeenCalledWith('jsonMiddleware'); // Return value of express.json mock
        });

        it('should use express.urlencoded middleware', () => {
            expect((mockExpressModule as any).urlencoded).toHaveBeenCalledWith({ extended: true });
            expect(app.use).toHaveBeenCalledWith('urlencodedMiddleware'); // Return value of express.urlencoded mock
        });
        
        it('should use siteMiddleware', () => {
            expect(app.use).toHaveBeenCalledWith('siteMiddlewareFunction'); // Value from the mock
        });

        it('should use navMiddleware', () => {
            expect(app.use).toHaveBeenCalledWith('navMiddlewareFunction'); // Value from the mock
        });

        it('should use socMiddleware', () => {
            expect(app.use).toHaveBeenCalledWith('socMiddlewareFunction'); // Value from the mock
        });

        it('should use routes', () => {
            expect(app.use).toHaveBeenCalledWith('routesFunction'); // Value from the mock
        });

        // Optional: Test middleware order if critical
        it('should register middleware in the expected order', () => {
            // app.use calls are captured in mockAppInstance.use.mock.calls
            const useCalls = mockAppInstance.use.mock.calls.map(call => call[0]);
            
            // Expected order based on app.ts
            // Note: 'sessionMiddlewareInstance' is the result of session(sessionConfig)
            // The exact order can be asserted if needed. For example:
            expect(useCalls).toContain('sessionMiddlewareInstance');
            expect(useCalls).toContain('staticMiddleware');
            // ... and so on for other middleware.
            // A more precise order check:
            const sessionIndex = useCalls.indexOf('sessionMiddlewareInstance');
            const staticIndex = useCalls.indexOf('staticMiddleware');
            const siteInfoIndex = useCalls.indexOf('siteMiddlewareFunction');
            const routesIndex = useCalls.indexOf('routesFunction');

            expect(sessionIndex).toBeLessThan(staticIndex);
            expect(staticIndex).toBeLessThan(siteInfoIndex); // Assuming siteMiddleware is after static
            expect(siteInfoIndex).toBeLessThan(routesIndex); // Assuming routes is one of the last
        });
    });
});