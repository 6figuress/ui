# UI

A React-based user interface for the project, built with TypeScript, Bun, and Vite. Packaged as a Docker container for easy deployment.

## Overview

This UI application is part of a larger project and is primarily designed to run as part of the [UX Stack](https://github.com/6figuress/ux-stack). It provides a web interface that generates 3D duck textures on the fly, processes payments, and integrates with various external services.

## Technologies

- React 19
- TypeScript
- Bun
- Vite
- Three.js (React Three Fiber)
- Netlify Functions
- Docker
- Azure Speech Services
- Stripe Payment Integration
- Notion API
- Cloudinary
- Gmail SMTP

## Prerequisites

- Docker Engine

## Docker Image

The application is packaged as a Docker image: `dij0s/ui:latest`. It is automatically built and pushed to Docker Hub on each push to the main branch.

### Environment Variables

The following environment variables must be configured:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Notion Configuration
NOTION_TOKEN=your_notion_token
NOTION_DATABASE_ID=your_database_id

# Email Configuration
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_app_password

# Azure Speech Services
VITE_AZURE_SPEECH_KEY=your_azure_speech_key
VITE_AZURE_SPEECH_REGION=your_azure_region

# Netlify Configuration
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Running the Application

### Standalone Docker Run
```bash
# Create .env file with your configuration
touch .env  # Add your environment variables

# Run the container
docker run -d \
  --name ui \
  -p 8888:8888 \
  --env-file .env \
  dij0s/ui:latest
```

### As Part of UX Stack
See the [UX Stack repository](https://github.com/6figuress/ux-stack) for full deployment instructions.

## Development and Modifications

To modify the application:

1. Clone the repository:
```bash
git clone https://github.com/6figuress/ui.git
cd ui
```

2. Make your changes to the source code

3. Build and test the Docker image locally:
```bash
# Build the image
docker build -t ui-dev .

# Run the container
docker run -d \
  --name ui-dev \
  -p 8888:8888 \
  --env-file .env \
  ui-dev
```

Alternatively, you can run the application locally without Docker:
3.5. Install dependencies and run locally:
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh

# Install and use Node.js 23.10.0
nvm install 23.10.0
nvm use 23.10.0

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Netlify CLI
npm install -g netlify-cli

# Install project dependencies
bun install

# Link to Netlify site
netlify link --id $NETLIFY_SITE_ID

# Run the application
bun run netlify dev
```

4. Test your changes at `http://localhost:8888`

### Project Structure
```
ui/
├── src/              # Application source code
├── netlify/          # Netlify serverless functions
├── public/           # Static assets
├── Dockerfile        # Container definition
├── .env.example     # Example environment configuration
└── package.json     # Dependencies and scripts
```

## CI/CD

The project uses GitHub Actions for continuous integration and deployment. On push to main:
1. Docker image is built
2. Image is pushed to Docker Hub as `dij0s/ui:latest`

## External Services

The application integrates with several external services. You'll need to set up accounts and obtain API keys for:

- Stripe (payment processing)
- Notion (database)
- Azure Speech Services (voice recognition for polyfill)
- Cloudinary (image storage)
- Gmail SMTP (email notifications)
