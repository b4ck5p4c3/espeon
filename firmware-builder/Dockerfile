FROM node:22-slim AS builder
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./ 
RUN ["pnpm", "install", "--frozen-lockfile"]
COPY . .
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
RUN ["pnpm", "run", "build" ]

FROM nginx:latest
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out/ /app/