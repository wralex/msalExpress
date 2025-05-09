import dotenv from '@dotenvx/dotenvx';
dotenv.config();
// --- Mocks ---
// Mock msalConfig: This needs to be mocked before authControl is imported.
const mockMsalConf = {
    auth: {
        clientId: process.env.CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET
    },
};
jest.mock('../../src/utils/msalConfig', () => ({
    __esModule: true, // For ES modules
    default: mockMsalConf,
}));

// Mock @azure/msal-node
const mockMsalTokenCacheInstance = {
    serialize: jest.fn(() => 'serializedTokenCacheData'),
    deserialize: jest.fn(),
};
const mockGetTokenCache = jest.fn(() => mockMsalTokenCacheInstance);

const mockMsalCCAInstance = {
    getAuthCodeUrl: jest.fn(),
    acquireTokenSilent: jest.fn(),
    acquireTokenByCode: jest.fn(),
    getTokenCache: mockGetTokenCache,
};
const mockConfidentialClientApplication = jest.fn(() => mockMsalCCAInstance);

const mockCryptoProviderInstance = {
    base64Encode: jest.fn((input: string) => `encoded-${input}`),
    base64Decode: jest.fn((input: string) => input.replace(/^encoded-/, '')), // Simplified decode
    generatePkceCodes: jest.fn(() => Promise.resolve({ verifier: 'testPkceVerifier', challenge: 'testPkceChallenge' })),
};
const mockCryptoProviderConstructor = jest.fn(() => mockCryptoProviderInstance);

jest.mock('@azure/msal-node', () => {
    const actualMsal = jest.requireActual('@azure/msal-node');
    return {
        ...actualMsal, // Retain other exports like Error classes, ResponseMode
        ConfidentialClientApplication: mockConfidentialClientApplication,
        CryptoProvider: mockCryptoProviderConstructor,
        // Define a mock class for InteractionRequiredAuthError that can be instantiated
        InteractionRequiredAuthError: class InteractionRequiredAuthError extends Error {
            constructor(message?: string) {
                super(message);
                this.name = "InteractionRequiredAuthError";
            }
        },
        ResponseMode: actualMsal.ResponseMode, // Use actual ResponseMode enum/object
    };
});

// Mock AxiosHelper
const mockCallApiGet = jest.fn();
jest.mock('../../src/utils/AxiosHelper', () => ({
    callApiGet: mockCallApiGet,
}));

// --- Imports ---
import { Response, NextFunction } from 'express';
// Import InteractionRequiredAuthError from the mocked msal-node for type checking and instantiation
import { ResponseMode, InteractionRequiredAuthError } from '@azure/msal-node';
import authController from '../../src/controllers/authControl'; // Import the controller instance (uses mocked msalConfig)
import { EnhancedSessRequest, AuthOptions } from '../../src/types'; // Assuming types.ts is in src/types
import msalConfigFromImport from '../../src/utils/msalConfig'; // To access the mocked config for resetting/checking

describe('AuthController', () => {
    let mockReq: Partial<EnhancedSessRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    const defaultAuthOptions: AuthOptions = {
        scopes: ['User.Read', 'openid', 'profile'],
        redirectUri: '/auth/test-redirect',
        successRedirect: '/app/test-success',
        postLogoutRedirectUri: 'http://localhost:3000/test-loggedout',
    };

    beforeEach(() => {
        // Reset msalConfig mutations from previous tests
        delete (msalConfigFromImport.auth as any).cloudDiscoveryMetadata;
        delete (msalConfigFromImport.auth as any).authorityMetadata;

        mockReq = {
            session: {
                destroy: jest.fn((callback?: (err: any) => void) => { if (callback) callback(null); }),
                // Other session properties will be added by tests as needed
            } as any, // Using 'any' for flexibility, or define a more specific mock session type
            body: {},
        };
        mockRes = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(), // For chaining
            json: jest.fn(), // For error responses, etc.
        };
        mockNext = jest.fn();

        // Clear all mock function calls
        mockCryptoProviderInstance.base64Encode.mockClear();
        mockCryptoProviderInstance.base64Decode.mockClear();
        mockCryptoProviderInstance.generatePkceCodes.mockClear();
        mockConfidentialClientApplication.mockClear(); // Clears calls to the constructor
        mockMsalCCAInstance.getAuthCodeUrl.mockClear();
        mockMsalCCAInstance.acquireTokenSilent.mockClear();
        mockMsalCCAInstance.acquireTokenByCode.mockClear();
        mockGetTokenCache.mockClear(); // Clears calls to the factory function
        mockMsalTokenCacheInstance.serialize.mockClear();
        mockMsalTokenCacheInstance.deserialize.mockClear();
        mockCallApiGet.mockClear();

        (mockRes.redirect as jest.Mock).mockClear();
        (mockNext as jest.Mock).mockClear();
        if (mockReq.session?.destroy) {
            (mockReq.session.destroy as jest.Mock).mockClear();
        }
    });

    describe('constructor', () => {
        it('should initialize with msalConfig and a new CryptoProvider', () => {
            // authController is a singleton instantiated when the module is imported.
            // We check that the CryptoProvider constructor was called.
            expect(mockCryptoProviderConstructor).toHaveBeenCalledTimes(1);
            expect((authController as any).msalConfig).toBe(msalConfigFromImport);
            expect((authController as any).cryptoProvider).toBe(mockCryptoProviderInstance);
        });
    });

    describe('login', () => {
        it('should fetch metadata, generate PKCE codes, set session variables, and redirect', async () => {
            mockCallApiGet
                .mockResolvedValueOnce({ cloud: 'metadata' }) // For getCloudDiscoveryMetadata
                .mockResolvedValueOnce({ authorityMeta: 'data' }); // For getAuthorityMetadata
            mockMsalCCAInstance.getAuthCodeUrl.mockResolvedValue('http://mockedauthcodeurl.com');

            const loginHandler = authController.login(defaultAuthOptions);
            await loginHandler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockCallApiGet).toHaveBeenCalledTimes(2);
            expect((msalConfigFromImport.auth as any).cloudDiscoveryMetadata).toBe(JSON.stringify({ cloud: 'metadata' }));
            expect((msalConfigFromImport.auth as any).authorityMetadata).toBe(JSON.stringify({ authorityMeta: 'data' }));

            const expectedStateObject = { successRedirect: defaultAuthOptions.successRedirect };
            expect(mockCryptoProviderInstance.base64Encode).toHaveBeenCalledWith(JSON.stringify(expectedStateObject));
            expect(mockCryptoProviderInstance.generatePkceCodes).toHaveBeenCalledTimes(1);

            expect(mockReq.session?.pkceCodes).toEqual({
                challengeMethod: 'S256',
                verifier: 'testPkceVerifier',
                challenge: 'testPkceChallenge',
            });
            expect(mockReq.session?.authCodeUrlRequest).toEqual(expect.objectContaining({
                state: `encoded-${JSON.stringify(expectedStateObject)}`,
                scopes: defaultAuthOptions.scopes,
                redirectUri: defaultAuthOptions.redirectUri,
                responseMode: ResponseMode.FORM_POST,
                codeChallenge: 'testPkceChallenge',
                codeChallengeMethod: 'S256',
            }));
            expect(mockReq.session?.authCodeRequest).toEqual(expect.objectContaining({
                state: `encoded-${JSON.stringify(expectedStateObject)}`,
                scopes: defaultAuthOptions.scopes,
                redirectUri: defaultAuthOptions.redirectUri,
                code: '',
            }));

            expect(mockMsalCCAInstance.getAuthCodeUrl).toHaveBeenCalledWith(mockReq.session?.authCodeUrlRequest);
            expect(mockRes.redirect).toHaveBeenCalledWith('http://mockedauthcodeurl.com');
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should use existing metadata if available', async () => {
            (msalConfigFromImport.auth as any).cloudDiscoveryMetadata = JSON.stringify({ cloud: 'existing' });
            (msalConfigFromImport.auth as any).authorityMetadata = JSON.stringify({ authority: 'existing' });
            mockMsalCCAInstance.getAuthCodeUrl.mockResolvedValue('http://anotherurl.com');

            const loginHandler = authController.login(defaultAuthOptions);
            await loginHandler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockCallApiGet).not.toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('http://anotherurl.com');
        });

        it('should use default redirectUri and successRedirect if not provided in options', async () => {
            (msalConfigFromImport.auth as any).cloudDiscoveryMetadata = "{}"; // Skip metadata fetch
            (msalConfigFromImport.auth as any).authorityMetadata = "{}";
            mockMsalCCAInstance.getAuthCodeUrl.mockResolvedValue('http://defaulturl.com');
            const options: AuthOptions = { scopes: ['User.Read'] }; // No redirectUri or successRedirect

            const loginHandler = authController.login(options);
            await loginHandler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            const expectedState = JSON.stringify({ successRedirect: '/' }); // Default successRedirect
            expect(mockCryptoProviderInstance.base64Encode).toHaveBeenCalledWith(expectedState);
            expect(mockReq.session?.authCodeUrlRequest?.redirectUri).toBe('/auth/redirect'); // Default redirectUri
            expect(mockRes.redirect).toHaveBeenCalledWith('http://defaulturl.com');
        });

        it('should call next with error if getAuthCodeUrl fails', async () => {
            (msalConfigFromImport.auth as any).cloudDiscoveryMetadata = "{}";
            (msalConfigFromImport.auth as any).authorityMetadata = "{}";
            const error = new Error('MSAL getAuthCodeUrl error');
            mockMsalCCAInstance.getAuthCodeUrl.mockRejectedValue(error);

            const loginHandler = authController.login(defaultAuthOptions);
            await loginHandler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });

         it('should propagate error if metadata fetching fails', async () => {
            delete (msalConfigFromImport.auth as any).cloudDiscoveryMetadata;
            delete (msalConfigFromImport.auth as any).authorityMetadata;
            const metadataError = new Error('Failed to fetch metadata');
            mockCallApiGet.mockRejectedValueOnce(metadataError); // First call to getCloudDiscoveryMetadata fails

            const loginHandler = authController.login(defaultAuthOptions);
            // The error from Promise.all for metadata will cause the async handler to reject.
            // Express would typically catch this and call next(error).
            // Here, we assert the promise rejection.
            await expect(loginHandler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext))
                .rejects.toThrow(metadataError);
            expect(mockNext).not.toHaveBeenCalled(); // next() is not called directly by this part of the code
        });
    });

    describe('acquireToken', () => {
        const mockTokenResponse = {
            accessToken: 'new-access-token',
            idToken: 'new-id-token',
            account: { homeAccountId: 'homeAcc', environment: 'env', tenantId: 'tid', username: 'user1' } as any,
        };

        beforeEach(() => {
            mockReq.session!.account = { username: 'currentuser' } as any;
            mockReq.session!.tokenCache = 'cachedSerializedToken';
        });

        it('should acquire token silently, update session, and redirect', async () => {
            mockMsalCCAInstance.acquireTokenSilent.mockResolvedValue(mockTokenResponse);
            mockMsalTokenCacheInstance.serialize.mockReturnValue('newSerializedTokenCache');

            const handler = authController.acquireToken(defaultAuthOptions);
            await handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockMsalTokenCacheInstance.deserialize).toHaveBeenCalledWith('cachedSerializedToken');
            expect(mockReq.session!.tokenCache).toBe('newSerializedTokenCache');
            expect(mockReq.session!.accessToken).toBe(mockTokenResponse.accessToken);
            expect(mockReq.session!.idToken).toBe(mockTokenResponse.idToken);
            expect(mockReq.session!.account).toBe(mockTokenResponse.account);
            expect(mockRes.redirect).toHaveBeenCalledWith(defaultAuthOptions.successRedirect);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should trigger login flow if InteractionRequiredAuthError occurs', async () => {
            const interactionError = new InteractionRequiredAuthError('interaction_needed');
            mockMsalCCAInstance.acquireTokenSilent.mockRejectedValue(interactionError);

            // Setup for the subsequent login call
            (msalConfigFromImport.auth as any).cloudDiscoveryMetadata = "{}";
            (msalConfigFromImport.auth as any).authorityMetadata = "{}";
            mockMsalCCAInstance.getAuthCodeUrl.mockResolvedValue('http://login-for-interaction.com');

            const handler = authController.acquireToken(defaultAuthOptions);
            await handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            // Verify login flow was initiated (e.g., redirect for auth code)
            expect(mockMsalCCAInstance.getAuthCodeUrl).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('http://login-for-interaction.com');
            expect(mockNext).not.toHaveBeenCalled(); // login handles its own errors/next calls
        });

        it('should call next with error for other errors from acquireTokenSilent', async () => {
            const otherError = new Error('Another MSAL error');
            mockMsalCCAInstance.acquireTokenSilent.mockRejectedValue(otherError);

            const handler = authController.acquireToken(defaultAuthOptions);
            await handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(otherError);
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });

        it('should use default successRedirect if not provided in options on success', async () => {
            mockMsalCCAInstance.acquireTokenSilent.mockResolvedValue(mockTokenResponse);
            const options: AuthOptions = { scopes: ['User.Read'] }; // No successRedirect
            const handler = authController.acquireToken(options);
            await handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);
            expect(mockRes.redirect).toHaveBeenCalledWith('/'); // Default successRedirect
        });
    });

    describe('handleRedirect', () => {
        const mockTokenResponseFromCode = {
            accessToken: 'token-from-auth-code',
            idToken: 'id-token-from-auth-code',
            account: { username: 'userFromCode' } as any,
        };

        beforeEach(() => {
            mockReq.body = {
                state: `encoded-${JSON.stringify({ successRedirect: '/final-destination' })}`,
                code: 'provided_auth_code',
            };
            mockReq.session!.authCodeRequest = {
                scopes: ['User.Read'],
                redirectUri: '/auth/test-redirect', // from original request
                code: '', // Will be populated
            } as any;
            mockReq.session!.pkceCodes = { verifier: 'sessionVerifier', challenge: 'sessionChallenge', challengeMethod: 'S256' };
            mockReq.session!.tokenCache = 'preExistingTokenCache';
            // Mock decode to return the actual object
            mockCryptoProviderInstance.base64Decode.mockImplementation((input: string) =>
                JSON.parse(input.replace(/^encoded-/, ''))
            );
        });

        it('should call next with error if req.body or req.body.state is missing', async () => {
            mockReq.body = {}; // Missing state and code
            const handler = authController.handleRedirect();
            await handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(new Error('Error: response not found'));
            expect(mockMsalCCAInstance.acquireTokenByCode).not.toHaveBeenCalled();

            //mockNext.mockClear();
            mockReq.body = { code: 'somecode' }; // State is missing
            await handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalledWith(new Error('Error: response not found'));
        });

        it('should call next with error if acquireTokenByCode fails', async () => {
            const msalError = new Error('acquireTokenByCode MSAL failure');
            mockMsalCCAInstance.acquireTokenByCode.mockRejectedValue(msalError);

            const handler = authController.handleRedirect();
            await handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(msalError);
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should destroy session and redirect to logout URI with postLogoutRedirectUri', () => {
            const handler = authController.logout(defaultAuthOptions);
            handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockReq.session!.destroy).toHaveBeenCalledTimes(1);
            // Manually invoke the callback of destroy to simulate its completion
            const destroyCallback = (mockReq.session!.destroy as jest.Mock).mock.calls[0][0];
            if (destroyCallback) destroyCallback();

            const expectedLogoutUri = `${msalConfigFromImport.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${defaultAuthOptions.postLogoutRedirectUri}`;
            expect(mockRes.redirect).toHaveBeenCalledWith(expectedLogoutUri);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should redirect to base logout URI if postLogoutRedirectUri is not provided', () => {
            const options: AuthOptions = {}; // No postLogoutRedirectUri
            const handler = authController.logout(options);
            handler(mockReq as EnhancedSessRequest, mockRes as Response, mockNext);

            expect(mockReq.session!.destroy).toHaveBeenCalledTimes(1);
            const destroyCallback = (mockReq.session!.destroy as jest.Mock).mock.calls[0][0];
            if (destroyCallback) destroyCallback();

            const expectedLogoutUri = `${msalConfigFromImport.auth.authority}/oauth2/v2.0/`;
            expect(mockRes.redirect).toHaveBeenCalledWith(expectedLogoutUri);
        });
    });

    describe('getMsalInstance', () => {
        it('should return a new ConfidentialClientApplication instance with the given config', () => {
            const customConfig: any = { auth: { clientId: 'custom-client' } };
            const instance = authController.getMsalInstance(customConfig);
            expect(mockConfidentialClientApplication).toHaveBeenCalledWith(customConfig);
            expect(instance).toBe(mockMsalCCAInstance); // Our mock constructor returns this
        });
    });

    describe('getCloudDiscoveryMetadata', () => {
        it('should call AxiosHelper.callApiGet and return its response', async () => {
            const apiResponse = { some: 'cloud_metadata' };
            mockCallApiGet.mockResolvedValue(apiResponse);
            const authority = 'https://login.microsoftonline.com/common';

            const result = await authController.getCloudDiscoveryMetadata(authority);

            expect(mockCallApiGet).toHaveBeenCalledWith(
                'https://login.microsoftonline.com/common/discovery/instance',
                undefined,
                {
                    'api-version': '1.1',
                    'authorization_endpoint': `${authority}/oauth2/v2.0/authorize`
                }
            );
            expect(result).toBe(apiResponse);
        });

        it('should throw an error if AxiosHelper.callApiGet fails', async () => {
            const error = new Error('API call failed');
            mockCallApiGet.mockRejectedValue(error);
            const authority = 'https://login.microsoftonline.com/common';

            await expect(authController.getCloudDiscoveryMetadata(authority)).rejects.toThrow(error);
        });
    });

    describe('getAuthorityMetadata', () => {
        it('should call AxiosHelper.callApiGet and return its response', async () => {
            const apiResponse = { some: 'authority_metadata' };
            mockCallApiGet.mockResolvedValue(apiResponse);
            const authority = 'https://login.microsoftonline.com/common';

            const result = await authController.getAuthorityMetadata(authority);

            expect(mockCallApiGet).toHaveBeenCalledWith(`${authority}/v2.0/.well-known/openid-configuration`);
            expect(result).toBe(apiResponse);
        });

        it('should log error and return undefined if AxiosHelper.callApiGet fails (as per current implementation)', async () => {
            const error = new Error('API call failed for authority metadata');
            mockCallApiGet.mockRejectedValue(error);
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const authority = 'https://login.microsoftonline.com/common';

            const result = await authController.getAuthorityMetadata(authority);

            expect(consoleLogSpy).toHaveBeenCalledWith(error);
            expect(result).toBeUndefined();
            consoleLogSpy.mockRestore();
        });
    });
});
