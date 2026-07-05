FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

USER node

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]
