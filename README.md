# Slackz

This is a Slack clone, built with [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/) component library, [Convex](https://www.convex.dev/) database and auth.

The application is deployed on Vercel [here](https://slack-clone-green-omega.vercel.app/).

## Features

### Core Chat Functionality
- Real-time messaging with channels and direct messages
- Thread support (one level deep)
- File uploads and attachments
- Emoji reactions
- User authentication with multiple providers (GitHub, Google, Password)

### AI-Powered Features
- **🤖 AI Response Generator**: One-click intelligent responses to any message using Google Gemini AI
  - Context-aware responses analyzing last 10 messages
  - Professional, helpful replies with clear AI identification
  - Works in channels, conversations, and threads
  - Smart targeting (only appears on others' messages)

- **Org Brain Plugin**: Ask questions about workspace content and get AI-generated summaries
- **Meeting Notes Generator**: Create consolidated summaries of thread discussions

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Convex (Database + Real-time + Auth)
- **AI Integration**: Google Gemini API (free tier)
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: Zustand, React Query
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google AI API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation
1. Clone the repository
```bash
git clone https://github.com/your-username/slack-clone.git
cd slack-clone
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Set up Convex
npx convex dev

# Add your Google AI API key
npx convex env set GOOGLE_AI_API_KEY your_api_key_here
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## AI Features Setup

### AI Response Generator
The AI Response feature is ready to use once you've set up the Google AI API key. Users can:
1. Hover over any message from another user
2. Click the blue robot icon 🤖 in the toolbar
3. Wait for the AI to generate a contextual response
4. The response appears as a new message with AI identification

For detailed setup and customization, see [AI_FEATURE_README.md](./AI_FEATURE_README.md).

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # Reusable UI components
├── features/               # Feature-specific components and hooks
│   ├── messages/          # Message-related functionality
│   │   ├── api/           # Message API hooks
│   │   └── component/     # Message components
│   ├── members/           # Member management
│   └── reactions/         # Emoji reactions
├── hooks/                 # Custom React hooks
└── lib/                   # Utility functions

convex/
├── schema.ts              # Database schema
├── messages.ts            # Message mutations and queries
├── auth.ts                # Authentication setup
└── _generated/            # Auto-generated Convex files
```

## Key Features Implementation

### Real-time Messaging
- Built with Convex real-time subscriptions
- Instant message delivery and updates
- Live typing indicators and presence

### AI Integration
- Google Gemini Pro for intelligent responses
- Context-aware conversation analysis
- Professional response generation
- Error handling and fallbacks

### File Handling
- Secure file uploads via Convex storage
- Support for images and documents
- Automatic file type detection

## Development Notes

1. For the API hooks, [@tanstack/react-query](https://tanstack.com/query/latest) is used to wrap the `useQuery` and `useMutation` hook from `convex/react`.
2. For form handling, [react-hook-form](https://react-hook-form.com/) is used.
3. Real-time functionality is powered by Convex's built-in WebSocket connections and live queries.
4. AI features use Google Gemini API with proper error handling and rate limiting considerations.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built following modern React and TypeScript best practices
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Real-time functionality powered by [Convex](https://www.convex.dev/)
- AI capabilities provided by [Google Gemini](https://ai.google.dev/)
