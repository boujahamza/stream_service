# syntax=docker/dockerfile:1

FROM node:stretch-slim

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production
RUN npx tsc streamingHandler.ts

COPY . .

CMD [ "node", "server.js" ]