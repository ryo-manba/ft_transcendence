FROM --platform=linux/amd64 node:16.18.0-alpine

WORKDIR /src

COPY package.json yarn.lock ./

RUN yarn

COPY . .

COPY ./init.sh /usr/local/bin

RUN chmod 755 /usr/local/bin/init.sh

ENTRYPOINT [ "init.sh" ]
