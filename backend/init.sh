#!/bin/sh

set -e

# # update database
yarn migrate

# start application
yarn build && yarn start
