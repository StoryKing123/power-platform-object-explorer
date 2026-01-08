# Component Detective

A web application for browsing Power Platform components.

## Tech Stack

- React 19
- TypeScript 5.9
- Vite 6
- Tailwind CSS 4
- shadcn/ui
- Framer Motion

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/ui/       # shadcn/ui components
├── services/
│   ├── api/             # D365 Web API client
│   ├── dataServices/    # Data services
│   └── transformers/    # Data transformers
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── data/                # Data type definitions
├── lib/                 # Library utilities
├── App.tsx              # Main app component
└── main.tsx             # App entry point
```

## License

MIT
