# Admin Dashboard

Separate admin dashboard application for managing tests and platform operations.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (create `.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3. Run the development server:
```bash
npm run dev
```

The admin dashboard will run on `http://localhost:3001`

## Features

- **Dashboard Overview**: View platform statistics and recent tests
- **Test Management**: Create, view, edit, and delete tests
- **Test Attempts**: View and manage test attempts (coming soon)
- **Analytics**: Platform analytics and insights (coming soon)

## Admin API Key

You need to set your admin API key in the dashboard header. This key should match the `ADMIN_API_KEY` environment variable in your backend.

## Access

Navigate to `http://localhost:3001` to access the admin dashboard.

