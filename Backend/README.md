# ContractLens Backend

Thin Express + TypeScript + MongoDB backend foundation for ContractLens AI contract-risk analysis application.

## Tech Stack
- Node.js
- Express
- TypeScript
- MongoDB & Mongoose
- dotenv
- cors

## Setup & Running

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `MONGODB_URI` points to a running MongoDB instance or MongoDB Atlas cluster (e.g., `mongodb://localhost:27017/contractlens` or `mongodb+srv://...`).

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Demo Data
To populate demo contracts (Vendor Services Agreement, SaaS Agreement, NDA):
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build and Run Production
```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/health` - Health check status
- `GET /api/contracts` - Returns list of contracts sorted newest first (`id`, `name`, `riskScore`, `riskLevel`, `createdAt`, `updatedAt`)
- `GET /api/contracts/:id` - Full contract record by ID
- `GET /api/contracts/:id/obligations` - Obligations for specified contract
- `POST /api/contracts` - Create a new contract record
- `PATCH /api/contracts/:id` - Update existing contract record
