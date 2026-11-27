# Entorno local reproducible de EcoPulso (no requiere cuenta en la nube)
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test && npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
