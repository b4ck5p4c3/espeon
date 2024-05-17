FROM node:21
WORKDIR /app
COPY ./package.json ./package.json 
COPY ./yarn.lock ./yarn.lock
RUN yarn --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL $NEXT_PUBLIC_BASE_URL
RUN yarn build
CMD yarn start