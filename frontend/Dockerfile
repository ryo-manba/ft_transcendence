FROM node:16.18.0-alpine

EXPOSE 3000

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

COPY ./init.sh /usr/local/bin

RUN chmod 755 /usr/local/bin/init.sh

ENTRYPOINT [ "init.sh" ]