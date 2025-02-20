FROM node:22.9.0-alpine AS builder
WORKDIR /app
COPY . .
RUN apk add g++ make py3-pip
RUN npm install -g node-gyp
RUN npm i 
RUN npm run build
RUN npm prune --production
RUN wget https://gobinaries.com/tj/node-prune && sh node-prune && node-prune

FROM node:22.9.0-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json .
RUN mkdir output-specs