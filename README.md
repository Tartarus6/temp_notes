# Temp Notes

A modern note-taking application built with SvelteKit, TailwindCSS, and TipTap, featuring a SQLite database for storage.

_Feel free to update this README as we add new features!!_

## Features Overview

- Rich text editing with TipTap
- File tree navigation
- Database storage with SQLite
- Responsive design with TailwindCSS

## Specific Text Features
- Markdown compatibility
    - Headings (H1, H2)
    - Lists (Bullet lists, Ordered lists)
    - Bold/Italic formatting
    - Task lists and checkboxes
    - Code blocks with syntax highlighting
    - Horizontal rules
    - Paragraph formatting
- Text alignment options
    - Left alignment
    - Center alignment
    - Right alignment
    - Justify alignment
- Inline mathquill latex
    - WYSIWYG latex editor
    - Support for mathematical symbols (pi, theta, etc.)
    - Functions like sqrt, sum, int, choose
    - Space behaves like tab for quick formula input
- Syntax highlighted code blocks (lowlight)
    - Tab support within code blocks
    - Multiple language support via highlight.js
- Image support
    - Drag and drop image insertion
    - Paste images from clipboard
    - File upload via button
    - Automatic image uploading
    - Base64 image encoding
- Document history
    - Undo/Redo functionality
    - Auto-saving with status indicators    

## Specific File Management Features
- Create new notes
- Rename notes
- Delete notes
- Context menus for file operations

## Prerequisites

- Node.js (v18+)
- npm (v8+)

## Installation

Clone the repository and install dependencies:

```shellscript
git clone https://github.com/Tartarus6/temp_notes.git
cd temp_notes
npm install
```

## Database Setup
Create the database file and format it. Also run the following to update database format if changed.

```shellscript
npx drizzle-kit push
```

## Running the Development Environment

The application requires both the backend server and frontend development server to run simultaneously.

```shellscript
# Start the backend server (in one terminal)
npm run start

# Start the frontend dev server (in another terminal)
npm run dev -- --open
```

## Building for Production

**look at `DEPLOYMENT.md` for detailed instructions**

## Project Structure

- `/src/lib` - Core components and utilities
- `/src/routes` - SvelteKit routes and API endpoints
- `/src/routes/api` - Server-side API routes that proxy to the tRPC server
- `/src/lib/server` - Backend tRPC server and database logic
- `/src/lib/client` - Client-side API communication utilities
- SQLite database file in project root

## Architecture

The application uses a layered architecture:

1. **Frontend (SvelteKit)**: Runs on port 5173 (dev) with reactive components
2. **SvelteKit API Layer**: RESTful API routes at `/api/*` that handle client requests
3. **Backend tRPC Server**: Internal server running on port 3001 with direct database access
4. **Database (SQLite)**: File-based storage with Drizzle ORM

The client never communicates directly with port 3001. Instead, all API calls go through SvelteKit's server-side API routes, which then communicate internally with the tRPC server.

## Development Workflow

1. Make your changes in the development environment
2. Run linting and type checking:

```shellscript
   npm run lint
   npm run check
```

3. Format your code:

```shellscript
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