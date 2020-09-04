FROM nginx:alpine

WORKDIR /app

COPY ./dist /app

COPY ./config/* /app/

EXPOSE 80

CMD ["sh", "run.sh"]
