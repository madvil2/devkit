FROM node:{{nodeMajor}}-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json ./
RUN v="$(node -p "require('./package.json').packageManager.match(/^pnpm@([^+]+)/)[1]")" && npm install -g "pnpm@$v"

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG SITE_URL
ARG NEXT_PUBLIC_API_MODE=http
ARG NEXT_PUBLIC_API_URL=https://api.example.com
ENV SITE_URL=$SITE_URL
ENV NEXT_PUBLIC_API_MODE=$NEXT_PUBLIC_API_MODE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
