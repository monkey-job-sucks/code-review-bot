FROM node:10-alpine as build-stage

WORKDIR /src

ADD package*.json /src/

RUN npm ci

ADD . /src

RUN npm run build

CMD npm start