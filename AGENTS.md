# The Project Management MVP web app

## Business Requirements

This project is building a Project Management App. Key features:
- A user can sign up (create an account) and sign in
- When signed in, the user sees a board representing their project
- The board has fixed columns that can be renamed
- The cards on the board can be moved with drag and drop, and edited

## Limitations

For the MVP, users are stored in the database with hashed passwords. Anyone can sign up with a unique username and a password (minimum 8 characters). A demo account ('user' / 'password') is seeded when the database is created. No password reset or rate limiting.

For the MVP, there will only be 1 board per signed in user.

For the MVP, this will run locally (in a docker container)

## Technical Decisions

- NextJS frontend
- Python FastAPI backend, including serving the static NextJS site at /
- Everything packaged into a Docker container
- Use pip with a requirements.txt (pinned versions) for Python dependencies
- Backend tests run inside the Docker container (no local Python required)
- Use SQLLite local database for the database, creating a new db if it doesn't exist
- Start and Stop server scripts for Mac, PC, Linux in scripts/ (PowerShell for Windows)

## Starting Point

A working MVP of the frontend has been built and is already in frontend. This is not yet designed for the Docker setup. It's a pure frontend-only demo.

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.
5. Never commit or push automatically. Only run `git commit` or `git push` when the user explicitly asks for it, and each request covers only that one commit or push.

## Working documentation

All documents for planning and executing this project will be in the docs/ directory.
Please review the docs/PLAN.md document before proceeding.