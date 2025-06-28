# frontend/Dockerfile

# Stage 1: Build the React application
FROM node:20-alpine as build-stage

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the React app for production
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:stable-alpine as production-stage

# Copy the built React app from the build-stage to Nginx's html directory
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy a custom Nginx configuration (optional, but good for SPAs)
# If you have a custom nginx.conf for your SPA, place it in frontend/nginx.conf
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default Nginx port
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
