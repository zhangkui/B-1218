FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 1218
CMD ["npm", "start"]
