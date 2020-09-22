FROM node:14-alpine
RUN apk add --update git
WORKDIR /app
COPY . .
RUN npm install 
ENTRYPOINT ["/app/bin/entrypoint.sh"]
