#!/bin/sh

set -e

# pull db and generate prisma client
yarn migrate

# start application
yarn dev