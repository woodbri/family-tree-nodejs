# Inherit from the latest Node.js Docker Hub image.
FROM node:latest

# Expose port 3000.
EXPOSE 3000

# Copy code into the image and run npm install.
COPY . /app
WORKDIR /app
RUN npm install

# Mount database volume.
VOLUME /app/db

# Start the application.
CMD [ "sh", "/app/start" ]

