#!/bin/sh
# wait-for-mongo.sh

set -e

host="$1"
shift
cmd="$@"

until mongo "$host" --eval 'db.adminCommand("ping")' >/dev/null 2>&1; do
  echo "Waiting for MongoDB at $host..."
  sleep 2
done

echo "MongoDB is up! Executing command..."
exec $cmd
