FROM node:18-alpine

WORKDIR /Learning_platform/client

COPY /client/package*.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
