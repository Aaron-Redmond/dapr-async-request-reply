# Dapr Async Request-Reply Demo

This project demonstrates the Asynchronous Request-Reply pattern using Dapr workflows in a Next.js application.

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/)
- Docker (for local development with Dapr)

## Installation

1. Install Dapr CLI and initialize Dapr:
```bash
# Initialize Dapr in your local environment
dapr init
```

2. Install project dependencies:
```bash
pnpm install
```

## Running the Application

### Local Development

1. Start the application with Dapr:
```bash
dapr run --app-id dapr-async-request-reply --app-port 3000 --dapr-http-port 3500 -- pnpm dev
```

This command:
- Starts your Next.js application on port 3000
- Starts the Dapr sidecar on port 3500
- Sets up the default Dapr components (state store, pub/sub)

### Running Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```