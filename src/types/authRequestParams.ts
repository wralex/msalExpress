
export type AuthRequestParams = {
    state: string,
    scopes: string[],
    redirectUri: string
};
export default AuthRequestParams;