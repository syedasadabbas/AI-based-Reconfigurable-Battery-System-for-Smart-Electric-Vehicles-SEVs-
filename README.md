# Battery Configuration Simulator

A web application for simulating and analyzing battery cell configurations. The system calculates voltage outputs for all possible switch combinations (4,096 configurations) across 4 battery cells, each with 3 switches.

## Features

- **Interactive Simulation**: Real-time battery switch simulator with circuit diagram visualization
- **Comprehensive Analysis**: Analyze all 4,096 configurations with voltage grouping
- **Advanced Filtering**: Filter by voltage class and connection type
- **Data Export**: Export results in CSV format with detailed switch states
- **Visual Charts**: Voltage distribution charts (bar, radar, pie) with PNG export
- **Auto-Run Mode**: Sequential testing of all configurations with pause/resume controls
- **Circuit Visualization**: SVG-based circuit diagrams showing active cells

---

## Local Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed on your laptop:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

### Step-by-Step Setup

#### 1. Download the Project

If you're on Replit:
- Click the three-dot menu (⋮) in the file explorer
- Select "Download as ZIP"
- Extract the ZIP file to your desired location

If you have the project from GitHub or another source:
- Clone or download the repository to your local machine

#### 2. Navigate to Project Directory

Open your terminal/command prompt and navigate to the project folder:

```bash
cd path/to/battery-configuration-simulator
```

#### 3. Install Dependencies

Install all required packages:

```bash
npm install
```

This will install all frontend and backend dependencies listed in `package.json`.

#### 4. Run the Application

Start the development server:

```bash
npm run dev
```

This command will:
- Start the Express backend server
- Start the Vite frontend development server
- Both will run on port 5000

#### 5. Access the Application

Open your web browser and go to:

```
http://localhost:5000
```

You should see the Battery Configuration Simulator dashboard.

### Troubleshooting

**Port 5000 already in use:**
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**Module not found errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Hosting Options

### Option 1: Replit Deployments (Recommended - Easiest)

**Best for:** Quick deployment with zero configuration

**Steps:**
1. Keep your project on Replit
2. Click the "Deploy" button in the Replit interface
3. Follow the deployment wizard
4. Your app will be live at `https://your-app.replit.app`

**Advantages:**
- Zero configuration required
- Automatic HTTPS
- Custom domain support
- Built-in monitoring
- One-click updates

**Pricing:** Free tier available, paid plans for production apps

---

### Option 2: Railway.app

**Best for:** Full-stack Node.js apps with persistent servers

**Steps:**
1. Sign up at https://railway.app/
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select your repository
4. Railway auto-detects Node.js and installs dependencies
5. Set environment variables if needed:
   - Go to Variables tab
   - Add `SESSION_SECRET=your-random-secret`
6. Your app deploys automatically

**Start Command:** Railway will use `npm run dev` from package.json

**Advantages:**
- Supports Express servers natively
- PostgreSQL database available
- Free $5 monthly credit
- Easy scaling

**Pricing:** Pay-as-you-go after free credits

**Documentation:** https://docs.railway.app/

---

### Option 3: Render.com

**Best for:** Free hosting with minimal setup

**Steps:**
1. Sign up at https://render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Configure the service:
   - **Name:** battery-simulator
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm run dev`
5. Add environment variables:
   - `SESSION_SECRET=your-random-secret`
6. Click "Create Web Service"

**Advantages:**
- Free tier with 750 hours/month
- Automatic deploys from Git
- Free SSL certificates
- PostgreSQL databases available

**Pricing:** Free tier available, paid plans from $7/month

**Documentation:** https://render.com/docs

---

### Option 4: Fly.io

**Best for:** Global edge deployment with low latency

**Steps:**
1. Install Fly CLI:
   ```bash
   # Mac
   brew install flyctl
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Sign up and login:
   ```bash
   flyctl auth signup
   # or
   flyctl auth login
   ```

3. Initialize your app:
   ```bash
   flyctl launch
   ```
   - Choose app name
   - Select region
   - Don't add PostgreSQL (using in-memory storage)
   - Don't deploy yet

4. Edit `fly.toml` if needed:
   ```toml
   [env]
     PORT = "5000"
   
   [[services]]
     internal_port = 5000
   ```

5. Deploy:
   ```bash
   flyctl deploy
   ```

**Advantages:**
- Global CDN with multiple regions
- Free tier: 3 VMs with 256MB RAM
- Great performance
- Easy scaling

**Pricing:** Free tier generous, paid plans from $1.94/month

**Documentation:** https://fly.io/docs/

---

### Option 5: Heroku

**Best for:** Traditional PaaS with extensive add-ons

**Steps:**
1. Sign up at https://heroku.com/
2. Install Heroku CLI
3. Login:
   ```bash
   heroku login
   ```

4. Create app:
   ```bash
   heroku create battery-config-simulator
   ```

5. Add buildpack:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

6. Set environment variables:
   ```bash
   heroku config:set SESSION_SECRET=your-random-secret
   ```

7. Deploy:
   ```bash
   git push heroku main
   ```

**Advantages:**
- Mature platform with lots of add-ons
- Easy database integration
- Extensive documentation

**Pricing:** Paid plans from $5/month (no free tier as of 2022)

**Documentation:** https://devcenter.heroku.com/

---

### Option 6: DigitalOcean App Platform

**Best for:** Professional deployments with managed infrastructure

**Steps:**
1. Sign up at https://www.digitalocean.com/
2. Go to App Platform
3. Click "Create App" → Connect your Git repository
4. Configure:
   - **Type:** Web Service
   - **Build Command:** `npm install`
   - **Run Command:** `npm run dev`
   - **HTTP Port:** 5000
5. Add environment variables
6. Deploy

**Advantages:**
- $200 free credit for new users
- Managed infrastructure
- Easy scaling
- Built-in monitoring

**Pricing:** From $5/month

**Documentation:** https://docs.digitalocean.com/products/app-platform/

---

## Deployment Comparison

| Platform | Free Tier | Best For | Setup Difficulty |
|----------|-----------|----------|------------------|
| **Replit** | ✅ Yes | Quick prototypes | ⭐ Easy |
| **Railway** | ✅ $5/month credit | Full-stack apps | ⭐⭐ Moderate |
| **Render** | ✅ 750 hrs/month | Free hosting | ⭐⭐ Moderate |
| **Fly.io** | ✅ 3 VMs free | Global deployment | ⭐⭐⭐ Advanced |
| **Heroku** | ❌ No | Enterprise apps | ⭐⭐ Moderate |
| **DigitalOcean** | ✅ $200 credit | Professional apps | ⭐⭐⭐ Advanced |

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **Wouter** for routing
- **TanStack Query** for state management
- **Shadcn UI** + **Radix UI** components
- **Tailwind CSS** for styling
- **Recharts** for data visualization

### Backend
- **Express.js** REST API
- **TypeScript** for type safety
- **In-memory storage** (Map-based)
- **Drizzle ORM** (PostgreSQL schema ready)

### Development Tools
- **Zod** for schema validation
- **React Hook Form** for forms
- **Lucide React** for icons

---

## Project Structure

```
battery-configuration-simulator/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Dashboard and Simulation pages
│   │   ├── lib/             # Utilities and helpers
│   │   └── App.tsx          # Main app component
│   └── index.html
├── server/                   # Backend Express server
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # In-memory storage
│   ├── circuit-solver.ts    # Circuit calculation logic
│   └── index.ts             # Server entry point
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Database schema
├── package.json             # Dependencies
└── vite.config.ts           # Vite configuration
```

---

## Environment Variables

Create a `.env` file in the root directory (optional for local development):

```env
SESSION_SECRET=your-random-secret-key-here
PORT=5000
```

For production deployments, set these in your hosting platform's environment variables section.

---

## Database (Optional)

The app currently uses **in-memory storage** for fast performance. To switch to PostgreSQL:

1. Set up a PostgreSQL database on your hosting platform
2. Add `DATABASE_URL` environment variable
3. Run migrations:
   ```bash
   npm run db:push
   ```

The schema is already defined in `shared/schema.ts` and ready to use.

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments in key files
3. Check your hosting platform's documentation

---

## License

This project is open source and available for educational purposes.
