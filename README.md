# notepad

A super simple notepad (Node.js + Express + React static page). The backend uses local file storage and provides read/write interfaces; the frontend uses React for rendering and interaction.

## Features
- Read and save a single note: `data/note.txt`
- React text editing, saving, and reloading
- Minimal dependencies, ready to use out of the box


## Quick Start
```bash
# install dependencies
npm install

# build frontend and run nodejs backend
npm run start

```

Default access: `http://localhost:5001` (to modify port, edit `PORT` in `server.js`)

## Build 
```bash
# build frontend and combine backend to dist/
npm run build

```

Get artifacts in  dist/
