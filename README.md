# Temp Notes

A modern note-taking application built with SvelteKit, TailwindCSS, and TipTap, featuring a SQLite database for storage.

## Features

- Rich text editing with TipTap
- File tree navigation
- Database storage with SQLite
- Responsive design with TailwindCSS

## Prerequisites

- Node.js (v18+)
- npm (v8+)

## Installation

Clone the repository and install dependencies:

**Windows:**
```batch
git clone https://github.com/Tartarus6/temp_notes.git
cd temp_notes
npm install
```

**Unix/Mac:**
```bash
git clone https://github.com/Tartarus6/temp_notes.git
cd temp_notes
npm install
```

## Running the Development Environment

The application requires both the backend server and frontend development server to run simultaneously.

**Windows:**
```batch
# Start the backend server (in one terminal)
npm run start

# Start the frontend dev server (in another terminal)
npm run dev -- --open
```

**Unix/Mac:**
```bash
# Start the backend server (in one terminal)
npm run start

# Start the frontend dev server (in another terminal)
npm run dev -- --open
```

## Building for Production

**Windows or Unix/Mac:**
```bash
# Run type checking
npm run check

# Format code
npm run format

# Lint code
npm run lint

# Build the production version
npm run build

# Preview the production build
npm run preview
```

## Project Structure

- `/src/lib` - Core components and utilities
- `/src/routes` - SvelteKit routes
- `/src/server.js` - Express backend server
- `/notes` - SQLite database location

## Development Workflow

1. Make your changes in the development environment
2. Run linting and type checking:
   ```bash
   npm run lint
   npm run check
   ```
3. Format your code:
   ```bash
   npm run format
   ```
4. Test your changes locally
5. Create a pull request

## Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [SvelteKit](https://kit.svelte.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [TipTap](https://tiptap.dev/)
- [SQLite](https://www.sqlite.org/)