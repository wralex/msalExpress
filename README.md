# MSAL/Express/Typescript/HBS/Docker/etc.

This is a sample site that I've put together with Node.js _(with Typescript)_ and other services that mainly focuse on use of logging in using a Microsoft Azure tenant.

This site was built upon the sample Node.JS web App that Microsoft provides while registering an app in the Azure Portal. In addition to this I've adjusted the layouts of the routes, controllers, and brought in other ideas from past experience that includes the following topics:

- [Node.js]
- [Handlebars.js]
- [Node Express]
- [Microsoft Authentication Library (MSAL) with Node]
- [Handlebars.js Helpers]
- [HBS Helpers with moment]
- [Bootstrap]
- [Jest]
- [Jest using Typescript (jest-ts)]

These are the basic building services I've used to generate a web site producing a a Docker Image using Typescript as base programming.

In addition to the code there is a series of Environmental variables that can be placed in a `.env` file contined in the root of your project and/or contained in your environment. These fields were also within the Microsoft Sample <small>(_[Microsoft Authentication Library (MSAL) with Node]_)</small> that was used as a basis of this project. These are the key fields and examples.

| Field Name | Example value |
|------|---------------|
| **GRAPH_API_ENDPOINT** | `https://graph.microsoft.com/` |
| **EXPRESS_SESSION_COOKIE_HTTPONLY** | `true` |
| **EXPRESS_SESSION_COOKIE_SECURE** | `false` |
| **PORT1** | `3080` |
| **REDIRECT_URI** | `http://localhost:3080/auth/redirect` |
| **POST_LOGOUT_REDIRECT_URI** | `http://localhost:3080` |
| **EXPRESS_SESSION_SECRET** | `TEST_AUTH_SECRET` |
| **INSTANCE** | `https://login.microsoftonline.com` |
| **TENANT_ID** | <mark>_(the tenant id of your Azure service)_</mark> |
| **CLIENT_ID** | <mark>_(created in the Web App registration)_</mark> |
| **CLIENT_SECRET** | <mark>_(created in the Web App registration in a new key)_</mark> |


[Node.js]: https://nodejs.org/en
[Handlebars.js]: https://handlebarsjs.com/
[Node Express]: https://expressjs.com/
[Microsoft Authentication Library (MSAL) with Node]: https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-v2-nodejs-webapp-msal
[Handlebars.js Helpers]: https://github.com/helpers/handlebars-helpers
[HBS Helpers with moment]: https://github.com/helpers/handlebars-helper-moment
[Jest]: https://jestjs.io/
[Jest using Typescript (jest-ts)]: https://www.npmjs.com/package/ts-jest
[Bootstrap]: https://getbootstrap.com/
