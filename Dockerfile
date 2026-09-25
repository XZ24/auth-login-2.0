# Stage 1: Build
FROM docker.io/library/node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG VITE_API_URL
ARG VITE_LOGIN_USERNAME
ARG VITE_LOGIN_PASSWORD
ARG VITE_BASE_PATH
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LOGIN_USERNAME=$VITE_LOGIN_USERNAME
ENV VITE_LOGIN_PASSWORD=$VITE_LOGIN_PASSWORD
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

# Stage 2: Serve
FROM docker.io/library/nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]