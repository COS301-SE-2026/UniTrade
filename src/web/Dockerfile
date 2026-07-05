FROM node:20-alpine

WORKDIR /app

RUN chown node:node /app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --ignore-scripts
 
COPY --chown=node:node . .


EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]
