import { Request } from "express";
import { Session } from "express-session";

export type EnhancedSessRequest = Request & {
    session: Session & {
        pkceCodes?: {
            challengeMethod: string;
            challenge?: string;
            verifier?: string;
        },
        tokenCache?: string,
        account?: any,
        accessToken?: string,
        idToken?: string,
        authCodeRequest?: any,
        authCodeUrlRequest?: any,
        isAuthenticated?: boolean
    };
};
export default EnhancedSessRequest;