// c:/Users/walexander/Repos/GitHub/msalExpress/__tests__/controllers/userControl.test.ts
import { NextFunction, Response } from 'express';
import { profileFn } from '../../src/controllers/userControl';
import { EnhancedSessRequest } from '../../src/types';
import { GRAPH_ME_ENDPOINT } from '../../src/utils/msalConfig'; // Assuming this is a simple named export

// Mock AxiosHelper. We mock the entire module.
jest.mock('../../src/utils/AxiosHelper');
// Import the mocked module to get access to the mocked functions
import AxiosHelper from '../../src/utils/AxiosHelper';

// Cast the mocked function to jest.Mock for type safety and autocompletion
const mockCallApiGet = AxiosHelper.callApiGet as jest.Mock;

describe('User Controller - profileFn', () => {
    let mockReq: Partial<EnhancedSessRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        // Reset mocks before each test
        mockCallApiGet.mockClear();

        mockReq = {
            session: {
                // Provide a default valid session
                accessToken: 'test-access-token',
            } as EnhancedSessRequest['session'],
        };
        mockRes = {
            render: jest.fn(), // Mock the render function
        };
        mockNext = jest.fn(); // Mock the next function
    });

    it('should call AxiosHelper.callApiGet with correct parameters and render profile on success', async () => {
        const mockGraphResponse = { displayName: 'Test User', mail: 'test@example.com' };
        mockCallApiGet.mockResolvedValue(mockGraphResponse); // Simulate a successful API call

        await profileFn(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

        expect(mockCallApiGet).toHaveBeenCalledTimes(1);
        expect(mockCallApiGet).toHaveBeenCalledWith(GRAPH_ME_ENDPOINT, 'test-access-token');
        expect(mockRes.render).toHaveBeenCalledTimes(1);
        expect(mockRes.render).toHaveBeenCalledWith('pages/user/profile', { profile: mockGraphResponse });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if AxiosHelper.callApiGet fails', async () => {
        const mockError = new Error('API call failed');
        mockCallApiGet.mockRejectedValue(mockError); // Simulate an API call failure

        await profileFn(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

        expect(mockCallApiGet).toHaveBeenCalledTimes(1);
        expect(mockCallApiGet).toHaveBeenCalledWith(GRAPH_ME_ENDPOINT, 'test-access-token');
        expect(mockRes.render).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should call next with error if accessToken is undefined and callApiGet fails', async () => {
        // Simulate a session where accessToken might be undefined
        mockReq.session!.accessToken = undefined;
        const mockErrorFromUndefinedToken = new Error('Access token is required by API');
        mockCallApiGet.mockRejectedValue(mockErrorFromUndefinedToken); // Simulate callApiGet failing due to undefined token

        await profileFn(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

        expect(mockCallApiGet).toHaveBeenCalledTimes(1);
        // AxiosHelper.callApiGet would be called with undefined token
        expect(mockCallApiGet).toHaveBeenCalledWith(GRAPH_ME_ENDPOINT, undefined);
        expect(mockRes.render).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith(mockErrorFromUndefinedToken);
    });
});