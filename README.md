<div align="center">
  <img src="pic%20for%20readme/Screenshot%202026-07-03%20200137.png" alt="Kino Logo" width="100%" style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.4);" />
  
  <br />
  <br />

  # KINO — The Private Vault

  **A sleek, cinematic, and private social vault for tracking Movies, Series, Anime, and Music.**

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#gallery">Gallery</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
</div>

---

## About The Project

**Kino** is a modern, privacy-focused media tracking and social platform tailored for audiophiles, cinephiles, and anime enthusiasts. Forget cluttered spreadsheets or disjointed lists—Kino provides a single, unified *Vault* to track what you watch and listen to, share favorites with friends, and discover new media in a beautifully crafted dark-mode environment.

Whether you're cataloging your latest anime binge or sharing your favorite albums, Kino is designed to feel like a premium, cinematic experience.

---

## Features

- **The Private Vault:** Organize your media into Movies, Series, Anime, and Music categories.
- **Social & Activity Feed:** Stay updated with your friends' latest favorites and added titles in real time.
- **Granular Privacy Controls:** Choose exactly who sees your watch history, favorites, and activity. 
- **Cinematic UI/UX:** A stunning, premium dark-mode interface built with Tailwind CSS v4 and Framer Motion for buttery-smooth animations.
- **Rich Profiles:** Customize your profile with avatars and dynamic banners. Show off your stats and top favorites!
- **Real-time Alerts:** Never miss a friend request or a message.
- **Blazing Fast:** Powered by Vite, React 19, and an Express 5 backend for lightning-fast performance.

---

## Gallery

<table align="center">
  <tr>
    <td align="center">
      <b>User Profile</b><br/>
      <img src="pic%20for%20readme/Screenshot%202026-07-03%20200816.png" alt="Profile" width="400"/>
    </td>
    <td align="center">
      <b>Activity Feed</b><br/>
      <img src="pic%20for%20readme/Screenshot%202026-07-03%20200143.png" alt="Activity Feed" width="400"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>Settings & Privacy</b><br/>
      <img src="pic%20for%20readme/Screenshot%202026-07-03%20200823.png" alt="Settings" width="400"/>
    </td>
    <td align="center">
      <b>Alerts & Notifications</b><br/>
      <img src="pic%20for%20readme/Screenshot%202026-07-03%20200810.png" alt="Alerts" width="400"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>Friends & Networking</b><br/>
      <img src="pic%20for%20readme/Screenshot%202026-07-03%20200148.png" alt="Friends" width="400"/>
    </td>
    <td align="center">
      <b>Elegant Authentication</b><br/>
      <img src="pic%20for%20readme/Screenshot%202026-07-03%20200449.png" alt="Login" width="400"/>
    </td>
  </tr>
</table>

---

## Tech Stack

### Frontend Architecture
- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Components:** [Radix UI](https://www.radix-ui.com/) (Headless accessibility)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing:** React Router / Wouter
- **Forms & Validation:** React Hook Form + Zod

### Backend Architecture
- **Runtime:** [Node.js](https://nodejs.org/) (TypeScript)
- **Framework:** [Express 5](https://expressjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** SQLite (Development) / PostgreSQL (Production)
- **Validation:** Zod
- **Media Processing:** Multer + Sharp (Auto-resizing & WebP conversion)
- **Authentication:** JWT (JSON Web Tokens) with bcryptjs

---

## Folder Structure

```text
Kino/
├── artifacts/
│   ├── api-server/         # Express 5 Backend
│   │   ├── prisma/         # Database schema & migrations
│   │   └── src/            # Backend logic (modules, middleware, routes)
│   ├── kino/               # React 19 Frontend
│   │   ├── src/
│   │   │   ├── api/        # API client and integrations
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── pages/      # Route pages (Vault, Feed, Profile, etc.)
│   │   │   └── store/      # Zustand state management
│   └── mobile/             # React Native / Expo application (Future/WIP)
├── pnpm-workspace.yaml     # Monorepo configuration
└── package.json            # Root workspace scripts
```

---

## Getting Started

Follow these instructions to set up the project locally for development.

### Prerequisites
- **Node.js** (v20 or higher)
- **pnpm** (v9 or higher recommended)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/kino.git
cd kino
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Setup Environment Variables
Navigate to the `api-server` and create a `.env` file:
```bash
cd artifacts/api-server
cp .env.example .env
```
Ensure you have the following variables set in `artifacts/api-server/.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db" # SQLite for local dev
JWT_SECRET="your_super_secret_jwt_key"
CORS_ORIGIN="http://localhost:5174"
```

### 4. Setup the Database
Still inside `artifacts/api-server`, push the schema to your local database:
```bash
pnpm dlx prisma db push
```

### 5. Start the Development Servers
From the root directory, start both the frontend and backend in parallel:
```bash
pnpm run --parallel --filter @workspace/api-server --filter @workspace/kino dev
```

- **Frontend:** `http://localhost:5174/kino`
- **Backend API:** `http://localhost:3001`

---

## UI/UX Design Philosophy

Kino's interface was designed with a **"content-first"** approach.
- **Glassmorphism & Shadows:** Deep, rich blacks combined with subtle glowing borders and drop shadows to give a premium feel.
- **Responsive Fluidity:** Layouts seamlessly adapt to mobile, tablet, and desktop views.
- **Micro-interactions:** Buttons, cards, and modal dialogs respond physically to hover and click events using Framer Motion spring physics.
- **Optimized Assets:** User-uploaded banners and avatars are automatically compressed and converted to `.webp` via the backend `Sharp` integration to ensure the UI remains blazing fast.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  <i>Built with dedication for media lovers.</i>
</p>
