FROM node:21 AS builder
WORKDIR /app
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn --frozen-lockfile
COPY . .
ARG NEXT_BASE_PATH
ENV NEXT_BASE_PATH=${NEXT_BASE_PATH}
RUN yarn build

FROM nginx:latest
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out/ /app/