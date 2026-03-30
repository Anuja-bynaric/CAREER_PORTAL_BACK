# Use Node.js
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Expose port 5000 (from your .env)
EXPOSE 5000

# Start the server
CMD ["npm", "run", "dev"]