/bin/sh ./config.sh
/bin/sh -c "DOLLAR='$' "envsubst < /app/nginx.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"