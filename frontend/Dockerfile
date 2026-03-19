FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Expose Vite dev server to network so it can be accessed from host
CMD ["npm", "run", "dev", "--", "--host"]
