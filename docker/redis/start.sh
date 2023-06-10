#!/bin/sh

# This script is inspired by https://github.com/mra-clubhouse/fly-redis/tree/custom-redis.

# Clear environment variables.
set -e

sysctl vm.overcommit_memory=1 || true
sysctl net.core.somaxconn=1024 || true

if [[ -z "${REDIS_PASSWORD}" ]]; then
  echo "The REDIS_PASSWORD environment variable is required"
  exit 1
fi


redis-server /usr/local/etc/redis/redis.conf --requirepass $REDIS_PASSWORD
