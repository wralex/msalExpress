import msal, {Configuration, CryptoProvider, ConfidentialClientApplication} from '@azure/msal-node';
import { Response, NextFunction } from 'express'
import { AuthOptions, EnhancedSessRequest, AuthRequestParams } from 'types';
import msalConfig from 'utils/msalConfig';
import AxiosHelper from 'utils/AxiosHelper';

class AuthController {
    msalConfig: Configuration;
    cryptoProvider: CryptoProvider;

    constructor(msalConfig: Configuration) {
        this.msalConfig = msalConfig;
        this.cryptoProvider = new CryptoProvider();
    };

    login(options: AuthOptions) {
        return async (req: EnhancedSessRequest, res: Response , next: NextFunction) => {
            const state = this.cryptoProvider.base64Encode(JSON.stringify({ successRedirect: options.successRedirect || '/' }));

            const authCodeUrlRequestParams: AuthRequestParams = {
                state: state,
                scopes: options.scopes || [],
                redirectUri: options.redirectUri || '/auth/redirect'
            };

            const authCodeRequestParams: AuthRequestParams = {
                state: state,
                scopes: options.scopes || [],
                redirectUri: options.redirectUri || '/auth/redirect'
            };

            if (!this.msalConfig.auth.cloudDiscoveryMetadata || !this.msalConfig.auth.authorityMetadata) {

                const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                    this.getCloudDiscoveryMetadata(this.msalConfig.auth.authority!),
                    this.getAuthorityMetadata(this.msalConfig.auth.authority!)
                ]);

                this.msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(cloudDiscoveryMetadata);
                this.msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
            }

            const msalInstance = this.getMsalInstance(this.msalConfig);

            // trigger the first leg of auth code flow
            return this.redirectToAuthCodeUrl(
                authCodeUrlRequestParams,
                authCodeRequestParams,
                msalInstance
            )(req, res, next);
        };
    }

    acquireToken(options: AuthOptions) {
        return async (req: EnhancedSessRequest, res: Response, next: NextFunction) => {
            try {
                const msalInstance = this.getMsalInstance(this.msalConfig);

                if (req.session.tokenCache) {
                    msalInstance.getTokenCache().deserialize(req.session.tokenCache);
                }
                const tokenResponse = await msalInstance.acquireTokenSilent({
                    account: req.session.account,
                    scopes: options.scopes || []
                });
                req.session.tokenCache = msalInstance.getTokenCache().serialize();
                req.session.accessToken = tokenResponse.accessToken;
                req.session.idToken = tokenResponse.idToken;
                req.session.account = tokenResponse.account;
                res.redirect(options.successRedirect || '/');
            } catch (error) {
                if (error instanceof msal.InteractionRequiredAuthError) {
                    return this.login({
                        scopes: options.scopes || [],
                        redirectUri: options.redirectUri || '/auth/redirect',
                        successRedirect: options.successRedirect || '/',
                    })(req, res, next);
                }
                next(error);
            }
        };
    }

    handleRedirect() {
        return async (req: EnhancedSessRequest, res: Response, next: NextFunction) => {
            if (!req.body || !req.body.state) {
                return next(new Error('Error: response not found'));
            }

            const authCodeRequest = {
                ...req.session.authCodeRequest,
                code: req.body.code,
                codeVerifier: req.session.pkceCodes!.verifier,
            };

            try {
                const msalInstance = this.getMsalInstance(this.msalConfig);

                if (req.session.tokenCache) {
                    msalInstance.getTokenCache().deserialize(req.session.tokenCache);
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

    logout(options: AuthOptions) {
        return (req: EnhancedSessRequest, res: Response, next: NextFunction) => {
            let logoutUri = `${this.msalConfig.auth.authority}/oauth2/v2.0/`;

            if (options.postLogoutRedirectUri) {
                logoutUri += `logout?post_logout_redirect_uri=${options.postLogoutRedirectUri}`;
            }

            req.session.destroy(() => {
                res.redirect(logoutUri);
            });
        }
    }

    getMsalInstance(msalConfig: Configuration) { return new ConfidentialClientApplication(msalConfig); }

    redirectToAuthCodeUrl(
        authCodeUrlRequestParams: AuthRequestParams,
        authCodeRequestParams: AuthRequestParams,
        msalInstance: ConfidentialClientApplication
    ) {
        return async (req: EnhancedSessRequest, res: Response, next: NextFunction) => {
            const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

            req.session.pkceCodes = {
                challengeMethod: 'S256',
                verifier: verifier,
                challenge: challenge,
            };

            req.session.authCodeUrlRequest = {
                ...authCodeUrlRequestParams,
                responseMode: msal.ResponseMode.FORM_POST, // recommended for confidential clients
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

    async getCloudDiscoveryMetadata(authority: string) {
        const endpoint = `https://login.microsoftonline.com/common/discovery/instance`;
        try {
            const response = await AxiosHelper.callApiGet(endpoint, undefined,
                {
                    'api-version': '1.1',
                    'authorization_endpoint': `${authority}/oauth2/v2.0/authorize`
                }
            );

            return response;

        } catch (error) {
            throw error;
        }
    }

    async getAuthorityMetadata(authority: string) {
        const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;
        try {
            const response = await AxiosHelper.callApiGet(endpoint);
            return response;
        } catch (error) {
            console.log(error);
        }
    }
}

const authController = new AuthController(msalConfig);
export default authController;
