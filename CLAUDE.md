# Claude Development Guidelines

## Project Overview
PostJob - Browser automation application for job posting across multiple platforms

## Branding & Design System

### Color Scheme
- **Primary Colors**: Following Airbnb's design system
  - Primary: #FF5A5F (Rausch - Airbnb's signature coral)
  - Secondary: #00A699 (Babu - Teal)
  - Dark: #484848 (Charcoal)
  - Light: #767676 (Gray)
  - Background: #FFFFFF (White)
  - Surface: #F7F7F7 (Light Gray)

### Central Branding Configuration
All colors and branding elements are managed centrally through:
- **Frontend**: `shared/constants.ts` - Contains the brand configuration object
- **Dynamic Theming**: Colors are passed dynamically to components via props or context
- **Single Source of Truth**: All color values reference the central configuration

Example structure:
```typescript
// shared/constants.ts
export const BRAND_CONFIG = {
  colors: {
    primary: '#FF5A5F',
    secondary: '#00A699',
    dark: '#484848',
    light: '#767676',
    background: '#FFFFFF',
    surface: '#F7F7F7'
  },
  // Additional branding elements
}
```

### Implementation Guidelines
1. **Never hardcode colors** - Always reference from the central configuration
2. **Use CSS variables** or **styled-components theme** for dynamic theming
3. **Component props** should accept color overrides when needed
4. **Maintain consistency** across all UI components

## Testing Commands
```bash
# Backend
cd backend
npm run test
npm run lint
npm run typecheck

# Frontend
cd frontend
npm run test
npm run lint
npm run typecheck
```

## Development Workflow
1. Always check existing code patterns before implementing new features
2. Use the central branding configuration for all UI elements
3. Run lint and typecheck before completing any task
4. Follow existing file structure and naming conventions

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL (production), SQLite (development)
- **Queue**: BullMQ with Redis
- **Browser Automation**: Playwright

## Key Features
- Multi-platform job posting automation
- Stripe payment integration
- JWT authentication
- Queue-based job processing
- Real-time status updates via WebSockets

## Environment Setup
Refer to LOCAL_SETUP.md for detailed environment configuration