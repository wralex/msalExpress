import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { loginFn, logoutFn, err404Fn, errHandler } from '../../src/controllers/baseControl';
import { Session, SessionData } from "express-session";

declare module 'express-session' {
    interface SessionData {
        isAuthenticated?: boolean;
    }
}

// Mock http-errors
jest.mock('http-errors');
const mockCreateError = createError as unknown as jest.Mock;
import * as myTypes from '../../src/types';

describe('Base Controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            session: {} as myTypes.EnhancedSessRequest["session"], // Initialize session object
            app: {
                get: jest.fn(),
            } as any,
        };
        mockRes = {
            redirect: jest.fn(),
            render: jest.fn(),
            status: jest.fn().mockReturnThis(), // For chaining res.status().render()
            locals: {}, // Initialize locals
        };
        mockNext = jest.fn();
        mockCreateError.mockClear();
    });

    describe('loginFn', () => {
        it('should redirect to / if session.isAuthenticated is true', () => {
            mockReq.session!.isAuthenticated = true;
            loginFn(mockReq as Request, mockRes as Response);
            expect(mockRes.redirect).toHaveBeenCalledWith('/');
            expect(mockRes.redirect).toHaveBeenCalledTimes(1);
        });

        it('should redirect to /auth/signin if session.isAuthenticated is false', () => {
            mockReq.session!.isAuthenticated = false;
            loginFn(mockReq as Request, mockRes as Response);
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/signin');
            expect(mockRes.redirect).toHaveBeenCalledTimes(1);
        });

        it('should redirect to /auth/signin if session.isAuthenticated is undefined', () => {
            // No isAuthenticated property on session
            loginFn(mockReq as Request, mockRes as Response);
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/signin');
            expect(mockRes.redirect).toHaveBeenCalledTimes(1);
        });
    });

    describe('logoutFn', () => {
        beforeEach(() => {
            // Mock session.destroy
            mockReq.session!.destroy = jest.fn((callback: (err: any) => void) => {
                callback(null);
                return {} as Session & Partial<SessionData>;
            });
        });

        it('should destroy session and redirect to /auth/signout if session.isAuthenticated is true', () => {
            mockReq.session!.isAuthenticated = true;
            logoutFn(mockReq as Request, mockRes as Response);
            expect(mockReq.session!.destroy).toHaveBeenCalledTimes(1);
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/signout');
        });

        it('should redirect to /auth/signin if session.isAuthenticated is false', () => {
            mockReq.session!.isAuthenticated = false;
            logoutFn(mockReq as Request, mockRes as Response);
            expect(mockReq.session!.destroy).not.toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/signin');
        });

        it('should redirect to /auth/signin if session.isAuthenticated is undefined', () => {
            logoutFn(mockReq as Request, mockRes as Response);
            expect(mockReq.session!.destroy).not.toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/signin');
        });

        it('should log error if session.destroy fails and still redirect', () => {
            mockReq.session!.isAuthenticated = true;
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const destroyError = new Error('Session destruction failed');
            mockReq.session!.destroy = jest.fn((callback) => {
                callback(destroyError);
                return {} as Session & Partial<SessionData>;
            });

            logoutFn(mockReq as Request, mockRes as Response);

            expect(mockReq.session!.destroy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Session destruction error:', destroyError);
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/signout');

            consoleErrorSpy.mockRestore();
        });
    });

    describe('err404Fn', () => {
        it('should call next with a 404 error from http-errors', () => {
            const error404 = new Error('Not Found');
            (error404 as any).status = 404;
            mockCreateError.mockReturnValue(error404);

            err404Fn(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCreateError).toHaveBeenCalledWith(404);
            expect(mockNext).toHaveBeenCalledWith(error404);
            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });

    describe('errHandler', () => {
        const sampleError = {
            message: 'Test error message',
            status: 400,
            stack: 'Error stack trace',
        };

        it('should set res.locals and render error page in development environment', () => {
            (mockReq.app!.get as jest.Mock).mockReturnValue('development');

            errHandler(sampleError, mockReq as Request, mockRes as Response);

            expect(mockRes.locals!.message).toBe(sampleError.message);
            expect(mockRes.locals!.error).toBe(sampleError); // In dev, the full error is exposed
            expect(mockRes.status).toHaveBeenCalledWith(sampleError.status);
            expect(mockRes.render).toHaveBeenCalledWith('/pages/error');
        });

        it('should set res.locals (without error object) and render error page in production environment', () => {
            (mockReq.app!.get as jest.Mock).mockReturnValue('production');

            errHandler(sampleError, mockReq as Request, mockRes as Response);

            expect(mockRes.locals!.message).toBe(sampleError.message);
            expect(mockRes.locals!.error).toEqual({}); // In prod, error object is empty
            expect(mockRes.status).toHaveBeenCalledWith(sampleError.status);
            expect(mockRes.render).toHaveBeenCalledWith('/pages/error');
        });

        it('should use err.status if available, otherwise default to 500', () => {
            (mockReq.app!.get as jest.Mock).mockReturnValue('development');
            const errorWithoutStatus = { message: 'Another error' };

            errHandler(errorWithoutStatus, mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500); // Default status
            expect(mockRes.render).toHaveBeenCalledWith('/pages/error');

            // Reset status mock for next assertion
            (mockRes.status as jest.Mock).mockClear();

            const errorWithStatus = { message: 'Error with status', status: 403 };
            errHandler(errorWithStatus, mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should handle an error object that is just a string (e.g. from throw "string error")', () => {
            (mockReq.app!.get as jest.Mock).mockReturnValue('development');
            const stringError = "This is a string error";

            errHandler(stringError, mockReq as Request, mockRes as Response);

            expect(mockRes.locals!.message).toBeUndefined(); // The string itself becomes the message
            expect(mockRes.locals!.error).toBe(stringError);   // In dev, the string error is exposed
            expect(mockRes.status).toHaveBeenCalledWith(500);   // Defaults to 500
            expect(mockRes.render).toHaveBeenCalledWith('/pages/error');
        });
    });
});