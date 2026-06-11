# Kino: Your Personal Media Vault 🎬 🎮 🎧

Welcome to **Kino**, a beautiful, blazingly fast, and entirely private media tracker. Kino allows you to effortlessly search and organize your favorite Movies, Series, Anime, Games, and Music—all in one elegant dashboard.

Built with bleeding-edge technologies (React 19, Vite, Tailwind CSS v4, and Framer Motion), Kino delivers a seamless app-like experience right in your browser. It uses zero-config public APIs to instantly fetch gorgeous cover art and rich metadata the moment you start typing.

---

## ✨ Features

- **Universal Search**: Instantly pull metadata and cover art for:
  - 🍿 Movies & 📺 Series (via OMDb)
  - ⛩️ Anime (via Jikan/MyAnimeList)
  - 🎮 Games (via OMDb)
  - 🎵 Music (via iTunes)
- **Zero-Config**: No API keys required. It just works out of the box.
- **Local-First Architecture**: Your vault, profile, and friends list are saved instantly to your local browser using `localforage` and `Zustand`. Blazing fast, works offline.
- **Dynamic UI**: Stunning glassmorphism design, real-time layout filtering, and hardware-accelerated micro-animations.
- **Social Feed**: Track your media activity chronologically and build your profile.

---

## 🚀 Step-by-Step Setup Guide

Getting Kino up and running on your local machine is incredibly simple.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine. We recommend using `pnpm` as the package manager, but `npm` or `yarn` will work fine too.

### 1. Clone the Repository
Download or clone this repository to your local machine:
```bash
git clone <your-repo-url>
cd kino-local
```

### 2. Install Dependencies
Install all the required packages for the application:
```bash
# If you are using pnpm (Recommended)
pnpm install

# Or, if you are using npm
npm install
```

### 3. Start the Development Server
Launch the app in development mode to start exploring:
```bash
# If you are using pnpm
pnpm run dev

# Or, if you are using npm
npm run dev
```

### 4. Open the App
Once the server starts, open your web browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173/`). 

You will be greeted by the login screen. Since Kino is currently a local-first application, you can simply type in any username you want to log in and start building your Vault!

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Local Database**: IndexedDB (via localforage)

---

## 📝 Note on Data Persistence
Currently, Kino runs entirely in your browser. All of your saved movies, stats, and profile settings are stored securely in your local browser cache. If you clear your browser data or switch devices, your vault will not sync. Adding a cloud-based backend (like Firebase or Supabase) is recommended if you wish to sync data across multiple devices.

Enjoy building your ultimate media vault!
