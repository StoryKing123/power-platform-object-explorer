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

# Pack as Power Platform solution (Web Resources)
pnpm build:solution

# Preview production build
pnpm preview
```

## Power Platform solution (Web Resources)

把构建后的 `dist/` 产物打包成可直接在 Power Platform 导入的 solution：

```bash
pnpm build:solution
```

产物：`solution/out/component_detective_unmanaged.zip`（Power Apps Maker Portal -> Solutions 里直接 Import）。

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
