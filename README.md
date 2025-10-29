# Share Note Server

A NestJS backend application for a note-sharing app with user authentication.

## Features

- ✅ User Authentication (JWT)
- ✅ Password Hashing (bcrypt with salt 10)
- ✅ User Registration & Login
- ✅ Token Verification
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ PostgreSQL Database with Sequelize ORM
- ✅ Comprehensive Testing (16/16 tests passing)

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd share-note-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   # Application
   NODE_ENV=development
   PORT=3000

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password_here
   DB_NAME=share-note
   DB_SYNC=true

   # JWT Configuration
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=24h
   ```

4. **Create the database**
   ```sql
   CREATE DATABASE "share-note";
   ```

## Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## Development

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm run test
npm run test:watch
npm run test:cov
```

## API Endpoints

### Authentication

All authentication endpoints are prefixed with `/api/user`:

| Method | Endpoint           | Description                    | Auth Required |
|--------|-------------------|--------------------------------|---------------|
| POST   | /api/user/signup  | Register a new user            | No            |
| POST   | /api/user/login   | Authenticate a user            | No            |
| POST   | /api/user/verify  | Verify JWT token               | Yes           |

### Health Check

| Method | Endpoint  | Description       |
|--------|-----------|-------------------|
| GET    | /         | Hello message     |
| GET    | /health   | Health check      |

For detailed API documentation, see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md).

## Quick Start Examples

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Verify Token

```bash
curl -X POST http://localhost:3000/api/user/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing with Postman

Import the provided Postman collection:

```bash
# Import postman_collection.json into Postman
```

The collection includes:
- Pre-configured requests for all endpoints
- Automatic token management
- Response validation tests

## Project Structure

```
src/
├── modules/
│   └── users/              # User authentication module
│       ├── dto/            # Data Transfer Objects
│       ├── entities/       # Database models
│       ├── tests/          # Unit tests
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── users.module.ts
├── common/
│   ├── guards/             # Auth guards
│   └── decorators/         # Custom decorators
├── database/               # Database configuration
├── app.controller.ts       # Main application controller
├── app.service.ts          # Main application service
├── app.module.ts           # Root application module
└── main.ts                 # Application entry point
```

## Documentation

- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Detailed implementation documentation
- [Users Module README](src/modules/users/README.md) - User authentication module documentation
- [Postman Collection](postman_collection.json) - API testing collection

## License

This project is [MIT licensed](LICENSE).
