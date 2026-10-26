# syntax=docker/dockerfile:1
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
ARG NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=false
ARG NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED=false
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=$NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED
ENV NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED=$NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
