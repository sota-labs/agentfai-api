# AgentFai
AgentFAI is a backend service that provides chat functionality through multiple AI agents. It supports:

- Integration with multiple AI agents through a unified API
- OAuth2 authentication for protected agent endpoints
- Real-time message handling and thread management
- Secure credential storage with encryption
- MongoDB for data persistence
- Redis for caching and session management

The service is built with NestJS framework and follows a modular architecture for maintainability and scalability.


## Dependencies
NodeJS v18

## Install dependencies
```bash
npm install
```

## Run script
```bash
npm run start:dev api
```

## Process description

- `api` - API server

## Create indexes

```bash
node dist/scripts/000-create-indexes.js up
```

## Drop indexes
```bash
node dist/scripts/000-create-indexes.js down
```
