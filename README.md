# AI Executive Coach & Lifestyle Systems Architect (LifeCoach)

A production-grade, cost-optimized, offline-first personal dashboard designed to eliminate procrastination, prevent optimization paralysis, and maintain a deterministic daily rhythm.

Targeted for high-scale executives transitioning to high-scale entrepreneur/CEO roles.

## 🚀 Key Features

- **6-Win Telemetry Scorecard**: Track the exact daily win metrics across health, mind, launchpad, family, investments, and spirit.
- **OLED Dark HUD UI**: High-contrast, hyper-minimalist black theme optimized for battery saving on AMOLED Android devices.
- **SQLite Local Engine**: Offline-first storage with instant responsive telemetry saves. No network connection required for daily updates.
- **Dual-Mode AI Chatbot**: Built-in chatbot for quick schedule adjustments, calibration reviews, and motivation boosters.
- **Zero Cost AI Integration**: Uses your Google AI Studio API key (Gemini 2.5 Flash free tier) to process all requests locally with zero hosting token costs.

## 📁 Repository Structure

```text
executive-coach-v2/
├── apps/
│   └── mobile/           # Expo React Native App (Android APK + PWA Web targets)
├── packages/
│   └── shared/           # Shared TypeScript types, prompts, and metric definitions
├── backend/              # Node.js + Fastify API (Vertex AI/Gemini SDK + PostgreSQL)
└── infra/                # GCP Cloud Run deployment configurations
```

## 🛠️ Local Setup Instructions

### Prerequisites
- Node.js v24.x & npm 11.x
- Expo CLI (`npm install -g expo-cli`)

### Installation & Launch
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/kampav/LifeCoach.git
   cd LifeCoach/apps/mobile
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the development server (Web / Android):
   ```bash
   npm run web      # Starts interactive web dashboard
   npm run android  # Deploys development build to Android emulator/device
   ```

## 🔒 Security & Secrets Management
- **Warning**: Do not hardcode or commit API keys or credentials directly to this repository.
- Use the secure in-app **⚙️ Settings panel** to save your personal Gemini API Key, which remains stored locally within your device's private SQLite instance.
