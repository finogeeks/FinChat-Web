#!/bin/sh
cp -f /app/env.js.template /app/env.js
sed -i "s@VERSION@${VERSION}@g"  /app/env.js