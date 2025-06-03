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
- **Org Brain Plugin**: Ask questions about workspace content and get AI-generated summaries
- **Auto-Reply Composer**: Generate professional reply drafts for any message or thread
- **Meeting Notes Generator**: Create consolidated summaries of thread discussions

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Convex (Database + Real-time + Auth)
- **AI Integration**: Google Gemini API (free tier)
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: Zustand, React Query
- **Deployment**: Vercel

## Note

1. For the API hooks, [@tanstack/react-query](https://tanstack.com/query/latest) is used to wrap the `useQuery` and `useMutation` hook from `convex/react`.
2. For form handling, [react-hook-form](https://react-hook-form.com/) is used.
3. Real-time functionality is powered by Convex's built-in WebSocket connections and live queries.
