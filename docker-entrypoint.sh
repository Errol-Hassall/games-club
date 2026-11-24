#!/bin/sh
set -eu

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

# Root is only needed long enough to give the data volume to PUID:PGID.
if [ "$(id -u)" = "0" ]; then
  chown -R "$PUID:$PGID" /data
  exec gosu "$PUID:$PGID" "$@"
fi

exec "$@"
