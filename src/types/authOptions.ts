export type AuthOptions = {
    successRedirect?: string,
    scopes?: string[],
    redirectUri?: string,
    postLogoutRedirectUri?: string
}
export default AuthOptions;