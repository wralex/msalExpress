// c:/Users/walexander/Repos/GitHub/msalExpress/src/controllers/__tests__/homeControl.test.ts
import { Request, Response } from 'express';
import { rootFn } from '../../src/controllers/homeControl'; // Adjust path as necessary

// Mock the express Request and Response objects
const mockRequest = (sessionData: any) => {
    return {
        session: { ...sessionData },
    } as unknown as Request;
};

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.render = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('Home Controller - rootFn', () => {
    it('should render the home page with username when user is authenticated', () => {
        const req = mockRequest({ account: { username: 'testuser' } });
        const res = mockResponse();

        rootFn(req, res);

        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith('pages/home', {
            title: 'Sample Web App',
            description: 'Sample Web App Description',
            username: 'testuser',
            layout: 'main',
        });
    });

    it('should render the home page with "Guest" when user is not authenticated', () => {
        const req = mockRequest({}); // No account in session
        const res = mockResponse();

        rootFn(req, res);

        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith('pages/home', {
            title: 'Sample Web App',
            description: 'Sample Web App Description',
            username: 'Guest',
            layout: 'main',
        });
    });

    it('should render the home page with "Guest" when session account is present but username is undefined', () => {
        const req = mockRequest({ account: {} }); // Account exists but no username
        const res = mockResponse();

        rootFn(req, res);

        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith('pages/home', {
            title: 'Sample Web App',
            description: 'Sample Web App Description',
            username: 'Guest',
            layout: 'main',
        });
    });
});