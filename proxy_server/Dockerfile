FROM node:22-bookworm-slim 

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the application
RUN npm run build

# Expose the port and start the application
EXPOSE 8080
CMD ["npm", "start"]
