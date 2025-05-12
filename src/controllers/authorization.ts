import express from 'express';
import * as MSAL from '@azure/msal-node';
import AxiosHelper from '../utils/AxiosHelper';
import config from '../utils/msalConfig';
import * as envs from '../utils/environmentals';
import _ from 'lodash';

declare module 'express-session' {
    interface Session {
        authCodeRequest?: any;
        authCodeUrlRequest?: MSAL.AuthorizationUrlRequest;
        pkceCodes?: {
            challengeMethod?: string;
            verifier: string;
            challenge?: string;
        };
        tokenCache?: string;
        idToken?: string;
        account?: any;
        isAuthenticated?: boolean;
    }
}

interface Options {
    successRedirect?: string;
    scopes?: string[];
    redirectUri?: string;
    postLogoutRedirectUri?: string;
}

class Authorization {
    
    msalConfig: MSAL.Configuration;
    cryptoProvider: MSAL.CryptoProvider;

    constructor(msalConfig: MSAL.Configuration) {
        this.msalConfig = msalConfig
        this.cryptoProvider = new MSAL.CryptoProvider();
    };

    login(options: Options = {}) {
        
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const redirect = options.redirectUri ?? `${req.protocol}://${req.host}/auth/redirect`;
            const scopes = options.scopes ?? [];

            const state = this.cryptoProvider.base64Encode(
                JSON.stringify({ successRedirect: options.successRedirect ?? `/` })
            );

            const authCodeUrlRequestParams = {
                state: state,
                scopes: scopes,
                redirectUri: redirect
            };

            const authCodeRequestParams = _.cloneDeep(authCodeUrlRequestParams);

            if (!this.msalConfig.auth.cloudDiscoveryMetadata || !this.msalConfig.auth.authorityMetadata) {
                const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                    this.getCloudDiscoveryMetadata(),
                    this.getAuthorityMetadata(
                        envs.Authority ?? (() => {
                            throw new Error("Authority is undefined"); })())
                ]);

                this.msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(cloudDiscoveryMetadata);
                this.msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
            }

            const msalInstance = this.getMsalInstance(this.msalConfig);

            return this.redirectToAuthCodeUrl(
                authCodeUrlRequestParams,
                authCodeRequestParams,
                msalInstance
            )(req, res, next);
        };
    }

    acquireToken(options: Options = {}) {
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const redirectUri = options.redirectUri ?? `${req.protocol}://${req.host}/auth/redirect`;
            const successRedirect = options.successRedirect ?? '/';
            const scopes = options.scopes ?? [];
            let account = req.session.account;
            let tokenCache = req.session.tokenCache;

            try {
                const msalInstance = this.getMsalInstance(this.msalConfig);

                if (tokenCache) {
                    msalInstance.getTokenCache().deserialize(tokenCache);
                }

                const tokenResponse = await msalInstance.acquireTokenSilent({
                    account: account,
                    scopes: scopes
                });

                req.session.tokenCache = msalInstance.getTokenCache().serialize();
                req.session.accessToken = tokenResponse.accessToken;
                req.session.idToken = tokenResponse.idToken;
                req.session.account = tokenResponse.account;

                res.redirect(successRedirect);
            } catch (error) {
                if (error instanceof MSAL.InteractionRequiredAuthError) {
                    return this.login({
                        scopes: scopes,
                        redirectUri: redirectUri,
                        successRedirect: successRedirect
                    })(req, res, next);
                }

                next(error);
            }
        };
    }

    handleRedirect(options = {}) {
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            
            let tokenCache = req.session.tokenCache;

            if (!req.body?.state) {
                return next(new Error('Error: response not found'));
            }

            const authCodeRequest: MSAL.AuthorizationCodeRequest = {
                ...req.session.authCodeRequest,
                code: req.body.code,
                codeVerifier: req.session.pkceCodes!.verifier,
                scopes: req.session.authCodeRequest?.scopes ?? [],
                redirectUri: req.session.authCodeRequest?.redirectUri ?? ''
            };

            try {
                const msalInstance = this.getMsalInstance(this.msalConfig);

                if (tokenCache) {
                    msalInstance.getTokenCache().deserialize(tokenCache);
                }

                const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, req.body);

                req.session.tokenCache = msalInstance.getTokenCache().serialize();
                req.session.idToken = tokenResponse.idToken;
                req.session.account = tokenResponse.account;
                req.session.isAuthenticated = true;

                const state = JSON.parse(this.cryptoProvider.base64Decode(req.body.state));
                res.redirect(state.successRedirect);
            } catch (error) {
                next(error);
            }
        }
    }

    logout(options: Options = {}) {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let logoutUri = `${this.msalConfig.auth.authority}/oauth2/v2.0/`;

            if (options.postLogoutRedirectUri) {
                logoutUri += `logout?post_logout_redirect_uri=${options.postLogoutRedirectUri}`;
            }

            req.session.destroy(() => {
                res.redirect(logoutUri);
            });
        }
    }

    getMsalInstance(msalConfig: MSAL.Configuration) {
        return new MSAL.ConfidentialClientApplication(msalConfig);
    }

    redirectToAuthCodeUrl(
        authCodeUrlRequestParams: MSAL.AuthorizationUrlRequest,
        authCodeRequestParams: MSAL.AuthorizationUrlRequest,
        msalInstance: MSAL.ConfidentialClientApplication) {
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

            req.session.pkceCodes = {
                challengeMethod: 'S256',
                verifier: verifier,
                challenge: challenge,
            };

            req.session.authCodeUrlRequest = {
                ...authCodeUrlRequestParams,
                responseMode: MSAL.ResponseMode.FORM_POST, // recommended for confidential clients
                codeChallenge: req.session.pkceCodes.challenge,
                codeChallengeMethod: req.session.pkceCodes.challengeMethod,
            };

            req.session.authCodeRequest = {
                ...authCodeRequestParams,
                code: '',
            };

            try {
                const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
                res.redirect(authCodeUrlResponse);
            } catch (error) {
                next(error);
            }
        };
    }

    async getCloudDiscoveryMetadata() {
        const endpoint = `${envs.CLOUD_INSTANCE}/common/discovery/instance`;

        try {
            const response = await AxiosHelper.callApiGet(
                endpoint, undefined,
                {
                    'api-version': '1.1',
                    'authorization_endpoint': `${envs.Authority}/oauth2/v2.0/authorize`
                });
            return response;
        } catch (error) {
            console.error("Error fetching cloud discovery metadata:", error);
            throw error;
        }
    }

    async getAuthorityMetadata(authority: string) {
        const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;

        try {
            const response = await AxiosHelper.callApiGet(endpoint);
            return response;
        } catch (error) {
            console.error("Failed to fetch authority metadata:", error);
            throw error;
        }
    }
}

const authorization = new Authorization(config);
export default authorization;
