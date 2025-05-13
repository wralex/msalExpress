# Build Layer
FROM node:current-slim AS builder
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "libman.ps1", "./"]
RUN npm install && npm install typescript -g
COPY . .
RUN npm run build

# Production Layer
FROM node:current-slim
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/config ./config
COPY --from=builder /usr/src/app/content ./content
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/views ./views
COPY --from=builder /usr/src/app/dist ./dist

RUN npm install --only=production
ENV NODE_ENV=production

ENV GRAPH_API_ENDPOINT="https://graph.microsoft.com/"
ENV CLOUD_INSTANCE="https://login.microsoftonline.com/"

EXPOSE 3080
RUN chown -R node /usr/src/app
USER node

CMD ["npm", "start"]
