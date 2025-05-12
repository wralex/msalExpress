import dotenv from '@dotenvx/dotenvx';
dotenv.config();

export const CLOUD_INSTANCE="https://login.microsoftonline.com";
export const GRAPH_API_ENDPOINT="https://graph.microsoft.com";

export const EXPRESS_SESSION_SECRET=process.env.EXPRESS_SESSION_SECRET;
export const TENANT_ID=process.env.TENANT_ID;
export const CLIENT_ID=process.env.CLIENT_ID;
export const CLIENT_SECRET=process.env.CLIENT_SECRET;
export const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI;

export const PORT=process.env.PORT ?? 3080;
export const NODE_ENV=process.env.NODE_ENV ?? 'development';
export const REDIRECT_URI = process.env.REDIRECT_URI ?? `http://localhost:${PORT}/auth/redirect`;
export const GRAPH_ME_ENDPOINT = `${process.env.GRAPH_API_ENDPOINT}/v1.0/me`;
export const Authority = `${CLOUD_INSTANCE}/${TENANT_ID}`
