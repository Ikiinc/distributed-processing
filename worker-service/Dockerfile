FROM node:20.18

WORKDIR /app

COPY package.json .
COPY src/ .

RUN npm install

ENV PORT 3000

EXPOSE 3000

CMD ["node", "index.js"]