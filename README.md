# Share Note Server

A NestJS backend application for a note-sharing app.

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

   Update the `.env` file with your database credentials:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password_here
   DB_NAME=share-note
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

## Project Structure

```
src/
├── database/           # Database configuration and modules
├── app.controller.ts   # Main application controller
├── app.service.ts      # Main application service
├── app.module.ts       # Root application module
└── main.ts            # Application entry point
```

## License

This project is [MIT licensed](LICENSE).
