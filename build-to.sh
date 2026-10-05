#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: ./build-to.sh <output-directory>" >&2
  exit 1
fi

npm run build -- --outDir "$1" --emptyOutDir
