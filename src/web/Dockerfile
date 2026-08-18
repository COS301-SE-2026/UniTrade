FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts
 
COPY  . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine
USER root
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER nginx
EXPOSE 8080
ENTRYPOINT [ "/entrypoint.sh" ]