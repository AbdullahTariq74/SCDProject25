# Use Node 16 LTS 
FROM node:16

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the project
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose backend port
EXPOSE 3000

# Start the app
CMD ["node", "main.js"]

