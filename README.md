# JARVIS Chat App - Setup & Execution Guide

## Prerequisites

Before running this project, ensure you have the following installed:

1.  **Node.js**: (v18 or higher recommended)
    - Check with: `node -v`
2.  **MongoDB**: You MUST have a local MongoDB database running.
    - Check with: `mongod --version`

## 1. Install Dependencies

Open your terminal in the project folder and run:
```bash
npm install
```

## 2. Environment Setup

Ensure you have a `.env.local` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/chatapp
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
JWT_SECRET=supersecretmarvelkey123
```

## 3. Start the Database (CRITICAL STEP)

The application **will not work** and will throw "Connection Refused" errors if MongoDB is not running.

### On macOS (using Homebrew)

**1. Install MongoDB (if you haven't):**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**2. Start the Database Service:**
```bash
brew services start mongodb-community
```

To verify MongoDB is running, type `mongod --version`. It should return the version number.

## 4. Run the Application

Start both the frontend and socket server with a single command:

```bash
npm run dev:all
```

- **Frontend**: http://localhost:3000
- **Socket Server**: http://localhost:4000 (Health Check: http://localhost:4000/health)

### Alternative: Run Separately
If you prefer separate terminals:
1. `npm run socket` (Port 4000)
2. `npm run dev` (Port 3000)

## Architecture

- **Next.js**: Handles frontend and HTTP API routes.
- **Socket.IO Server**: Standalone Node.js server for real-time features.
  - Doing this separation prevents "Next.js Dev Server" conflicts with WebSockets.

## Troubleshooting

### "MongooseServerSelectionError: connect ECONNREFUSED"
- **Cause**: MongoDB is not running.
- **Fix**: See Step 3 above. Start MongoDB!

### High Loading Times / 500 Errors
- Ensure MongoDB is running. The app fails fast (5s) if DB is down.
