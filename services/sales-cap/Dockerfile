FROM node:12.20.0-alpine3.12
WORKDIR /usr/src/app
COPY . .

ENV NODE_ENV=production

RUN npm i -g @sap/cds && \
    npm config set user 0 && \
    npm config set unsafe-perm true && \
    npm install && \
    npm run-script build

EXPOSE 4004
USER node
CMD [ "npm", "start" ]