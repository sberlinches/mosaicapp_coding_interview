# mosaicapp_coding_interview

## Running the app

### Pre-requisites 
- Node.js version 24 or higher
- npm version 11 or higher
- Postgres instance with the `seed.sql` already loaded

### API
1. Navigate to the project directory: `cd mosaicapp_coding_interview/api`
2. Install dependencies: `npm ci`
3. Generate Prisma schemas: `npx prisma generate`
4. Create environment variables: `cp .env.example .env`
5. Start the application: `npm start`

### Client
1. Navigate to the project directory: `cd mosaicapp_coding_interview/client`
2. Install dependencies: `npm ci`
3. Create environment variables: `cp .env.example .env`
4. Start the application: `npm dev`
