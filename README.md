# Bitespeed Identity Reconciliation API

This is a Node.js and Express API that reconciles customer identities based on email and/or phone number. It finds out whether the contact is new or already linked to existing profiles and keeps the records consistent.

## Live Endpoint

POST https://bitespeed-api-m897.onrender.com/identify

## Request Format

* Content-Type: application/json
* At least one of `email` or `phoneNumber` must be provided.

### Example Payload

```json
{
  "email": "example@gmail.com",
  "phoneNumber": "1234567890"
}
```

### Sample cURL Request

```bash
curl -X POST https://bitespeed-api-m897.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "example@gmail.com", "phoneNumber": "1234567890"}'
```

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bitespeed.git
cd bitespeed
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file in the root directory with the following content:

```
DATABASE_URL=your_postgres_connection_url
```

### 4. Generate Prisma Client (if needed)

```bash
npx prisma generate
```

### 5. Start the Server

```bash
npm start
```

---

Built by Lazim :)
