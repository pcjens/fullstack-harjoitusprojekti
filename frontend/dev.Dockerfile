FROM node:alpine

WORKDIR /usr/src/frontend
COPY . .
RUN npm install

ENTRYPOINT ["npm", "run", "dev", "--", "--host"]
