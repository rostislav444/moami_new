# Use the official Node.js image as the base image
FROM node:20-alpine

# Install PM2 globally
RUN npm install -g pm2

# Set the working directory
WORKDIR /app/frontend

# Copy project files to the working directory
COPY . .

# Install dependencies with legacy-peer-deps flag
RUN npm install --legacy-peer-deps

# Build the project
RUN npm run build

# Expose the necessary port (e.g., port 3000 for Next.js)
EXPOSE 3000

# Run the application using PM2
CMD ["pm2-runtime", "start", "npm", "--", "run", "start"]
