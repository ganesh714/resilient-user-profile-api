# Resilient User Profile Management API

A robust, fault-tolerant backend API for managing user profiles, built with Node.js, Express, TypeScript, and MySQL. This project demonstrates advanced architectural patterns including the Repository pattern, Unit of Work, Circuit Breaker, and Exponential Backoff Retries.

## Features

- **Layered Architecture**: Clear separation of concerns (Controller, Service, Repository).
- **Unit of Work & Repository Patterns**: Manages database transactions and abstracts data access.
- **Resilience Engineering**: Custom implementations of Exponential Backoff Retries and a Circuit Breaker to gracefully handle a simulated unreliable external enrichment service.
- **Graceful Degradation**: Fallback mechanisms when the external dependency fails.
- **Containerized**: Full Docker orchestration via `docker-compose`.
- **Validation & Error Handling**: Zod-based request validation and standardized global JSON error responses.

## Prerequisites

- Docker and Docker Compose

## Quick Start

1. **Clone the repository.**
2. **Start the infrastructure**:
   ```bash
   docker-compose up -d --build
   ```
3. The API will be available at `http://localhost:8080/api` once the database healthcheck passes.
4. The database is automatically seeded with 3 test users.

## API Documentation

An OpenAPI (Swagger) specification is available in `openapi.yaml` in the root of the project.

### Endpoints
- `POST /api/users`: Create a user.
- `GET /api/users/{id}`: Get a user.
- `PUT /api/users/{id}`: Update a user.
- `DELETE /api/users/{id}`: Delete a user.
- `GET /api/users/{id}/enriched`: Get a user with mock enriched data (demonstrates resilience patterns).

## Testing

To run tests, execute them inside the API container:

```bash
docker-compose exec api npm run test
```

*Note: You need to add the test script to package.json.*
