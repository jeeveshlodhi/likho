# Likho Admin Dashboard

A modern admin dashboard for managing the Likho beta application.

## Features

- **Dashboard**: View real-time statistics, version distribution, recent feedback, and errors
- **Feature Flags**: Toggle features on/off and manage rollout percentages
- **Remote Config**: Manage app configuration values dynamically
- **Feedback Management**: Review and respond to user feedback
- **Version Management**: Manage app releases and force updates

## Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type safety
- **Vite** - Fast development and building
- **Tailwind CSS v4** - Utility-first styling
- **Zustand** - State management
- **Recharts** - Data visualization
- **React Router v7** - Navigation

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Likho backend running (for full functionality)

### Installation

```bash
# Install dependencies
npm install

# Or with bun
bun install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
- `VITE_API_URL` - URL of your Likho backend API
- `VITE_ADMIN_API_KEY` - Admin API key for authentication

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:1421`

### Building

```bash
npm run build
```

## API Integration

The dashboard expects a FastAPI backend with these admin endpoints:

### Endpoints Required

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/stats` | GET | Dashboard statistics |
| `/admin/versions/distribution` | GET | Version distribution data |
| `/admin/feature-flags` | GET/POST/PATCH/DELETE | Feature flag management |
| `/admin/remote-config` | GET/POST/PATCH/DELETE | Remote config management |
| `/admin/feedback` | GET/PATCH | Feedback management |
| `/admin/versions` | GET/POST/PATCH/DELETE | Version management |

### Authentication

All requests include the header:
```
X-Admin-API-Key: your-api-key
```

## Mock Data

If no `VITE_ADMIN_API_KEY` is set, the dashboard uses mock data for development and testing.

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── Layout.tsx       # Sidebar navigation layout
│   ├── lib/
│   │   ├── api.ts           # API client with mock data
│   │   ├── store.ts         # Zustand state management
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── FeatureFlags.tsx # Feature flag management
│   │   ├── RemoteConfig.tsx # Remote config management
│   │   ├── Feedback.tsx     # Feedback management
│   │   └── Versions.tsx     # Version management
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── App.tsx              # Router setup
│   ├── index.css            # Tailwind CSS styles
│   └── main.tsx             # App entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## License

Same as Likho project
