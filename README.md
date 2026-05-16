# Algeria Travel SaaS — Multi-Tenant Platform

## Overview
A complete multi-tenant SaaS platform built for Algerian travel agencies to automate lead capture, AI chatbot responses, and instant website generation per tenant.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, TypeScript
- **Database:** Supabase (PostgreSQL, Row-Level Security)
- **AI Models:** Google Gemini (main chatbot), OpenAI Whisper (Darja voice-to-text)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm or yarn
- Supabase Project

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Setup:
   Copy `.env.local.example` to `.env.local` and fill in the required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `WHISPER_API_KEY`

3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

### Database Setup
To initialize your Supabase instance, run the SQL script located in `supabase/migrations/0001_initial_schema.sql` in your Supabase SQL Editor. This will set up the multi-tenant architecture and Row-Level Security policies.
