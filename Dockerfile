# Base image
FROM node:18-alpine

# Working directory inside the container
WORKDIR /app

# Copy dependency manifests first so npm install is cached
# unless package.json/package-lock.json actually change
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Port the app listens on
EXPOSE 3000

# Start the server
CMD [ "node", "server.js" ]
