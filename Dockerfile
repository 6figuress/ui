FROM oven/bun:latest

WORKDIR /app

# Install curl and Node.js dependencies
RUN apt-get update && apt-get install -y curl

# Install NVM
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=23.10.0

RUN mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
SHELL ["/bin/bash", "--login", "-c"]
RUN source $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use default

# Add node and npm to path so the commands are available
ENV NODE_PATH=$NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH=$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Install netlify-cli globally
RUN npm install -g netlify-cli

ARG NETLIFY_AUTH_TOKEN
ENV NETLIFY_AUTH_TOKEN=$NETLIFY_AUTH_TOKEN

# Copy package files and install dependencies
COPY package.json ./
RUN bun install

# Copy the rest of the application
COPY . .

# Copy .env file
COPY .env ./

EXPOSE 8888

CMD netlify login --auth $NETLIFY_AUTH_TOKEN && bun run netlify dev --port 8888
