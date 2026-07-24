# Theta Indigo Blueprint

A modern spiritual AI platform that provides personalized numerology, chakra analysis, and energy insights.

## Features

- **Spiritual Analysis Engine**: Calculate Life Path, Soul, Destiny, and other numerology numbers
- **Chakra Analysis**: Analyze your 7 chakras with energy percentages and healing recommendations
- **Aura Reading**: Discover your aura colors and their meanings
- **Indigo Classification**: Identify your spiritual archetype (Warrior, Mystic, Healer, Visionary, Creator)
- **Personalized Affirmations**: Generate daily affirmations based on your spiritual profile
- **Life Timeline**: Visualize your spiritual journey phases
- **Authentication**: Google, email/password, and guest mode support
- **Responsive Design**: Beautiful mystical UI optimized for mobile and desktop
- **PWA Ready**: Install as a mobile app

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Firebase** - Authentication and Firestore database
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **jsPDF** - PDF report generation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd indigo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure Firebase:
- Create a Firebase project at https://console.firebase.google.com
- Enable Authentication (Google, Email/Password)
- Create Firestore database
- Copy your Firebase credentials to `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

## Project Structure

```
indigo/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── demo/              # Demo mode
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # UI components
│   ├── reading-form.tsx  # Input form
│   └── reading-result.tsx # Results display
├── lib/                  # Utility libraries
│   ├── affirmation-engine.ts
│   ├── firebase.ts
│   ├── spiritual-engine.ts
│   └── utils.ts
├── types/                # TypeScript types
└── public/              # Static assets
```

## Firebase Setup

### Authentication

Enable the following sign-in methods in Firebase Console:
- Google
- Email/Password

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /readings/{readingId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Build

```bash
npm run build
npm start
```

## Features to Implement

- [ ] AI spiritual reading integration (OpenAI/Anthropic)
- [ ] PDF report generation with jsPDF
- [ ] Admin panel for managing rules and prompts
- [ ] Cloudflare R2 integration for image storage
- [ ] WhatsApp sharing functionality
- [ ] Daily energy predictions
- [ ] Moon cycle integration
- [ ] Spiritual compatibility analysis
- [ ] Meditation recommendations
- [ ] Frequency healing features

## License

This project is proprietary software.

## Support

For support, please contact the development team.
