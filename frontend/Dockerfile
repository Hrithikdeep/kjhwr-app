# Stage 1: build the app with Node
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies first so Docker can cache this layer.
# "npm ci" installs exactly the versions in package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite writes this address into the JavaScript while it builds, so it must be
# known now, at build time. Setting it when the container starts would be too late.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# Stage 2: serve the built files with nginx (no Node in the final image)
FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
