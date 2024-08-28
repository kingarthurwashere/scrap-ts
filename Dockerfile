# docker file for node typescript express app

# Use the official image as a parent image
FROM node:18-alpine3.18


# Set the working directory
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .


# Install any needed packages specified in package.json

RUN npm install -g pnpm
RUN pnpm install


# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD ["npm", "start"]