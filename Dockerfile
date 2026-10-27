# --- Etape 1 : build Angular ---
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# --- Etape 2 : Nginx sert le frontend et proxy /api vers le backend ---
FROM nginx:1.27-alpine
COPY --from=build /build/dist/kiiraay-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
