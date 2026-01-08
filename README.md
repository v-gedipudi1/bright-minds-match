# BrightMinds Tutoring Platform

A modern peer-to-peer tutoring marketplace that connects students with qualified tutors using AI-powered matching technology.

🌐 **Live Site:** [https://brightminds.lovable.app](https://brightminds.lovable.app)

## 🌟 Features

### For Students
- **AI-Powered Tutor Matching** - Get matched with the perfect tutor based on your learning style, goals, and personality
- **Easy Session Booking** - Browse tutors, view availability, and book sessions seamlessly
- **Real-time Messaging** - Communicate directly with tutors before and after sessions
- **Session Management** - Track upcoming, completed, and cancelled sessions
- **Tutor Reviews** - Leave feedback and help other students find great tutors

### For Tutors
- **Profile Management** - Showcase your expertise, education, and teaching style
- **Flexible Scheduling** - Set your own availability and hourly rates
- **Stripe Integration** - Get paid directly with secure payment processing
- **Student Management** - View enrolled students and session history
- **Performance Leaderboard** - Compete and gain visibility among top tutors

### Platform Features
- **Secure Payments** - Stripe Connect integration with transparent 8% platform fee
- **Real-time Notifications** - Stay updated on messages and session changes
- **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- **Dark/Light Mode** - Choose your preferred theme

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Payments | Stripe Connect |
| AI | Google Gemini for tutor matching |
| State Management | TanStack Query |
| Routing | React Router v6 |

## 📸 Screenshots

> **Note:** To add screenshots, create a `docs/images/` folder and add your own screenshots:
> - `landing-page.png` - Full landing page with hero section
> - `tutor-profile.png` - Tutor profile page with subjects and ratings
> - `ai-matching.png` - AI matching questionnaire or results
> - `booking-flow.png` - Tutor selection and booking process
> - `messaging.png` - Real-time messaging interface
> - `student-dashboard.png` - Dashboard with upcoming sessions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/brightminds.git

# Navigate to project directory
cd brightminds

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
└── lib/                # Utility functions

supabase/
├── functions/          # Edge functions
│   ├── ai-match/       # AI tutor matching
│   ├── create-session-payment/  # Stripe payments
│   └── ...
└── migrations/         # Database migrations
```

## 💳 Payment Flow

1. Student books a session with a tutor
2. Payment is processed via Stripe Checkout
3. Platform retains 8% as service fee
4. Remaining 92% is transferred to tutor's connected Stripe account

## 🔐 Security

- Row Level Security (RLS) policies on all database tables
- Secure authentication via Supabase Auth
- Stripe Connect for PCI-compliant payment handling
- Protected API routes with JWT verification

## 📱 Responsive Design

BrightMinds is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For questions or support, please reach out via the contact form on the platform.

---

Built with ❤️ for students and tutors everywhere.
