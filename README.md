# Video Logs

Video Logs is a web application for recording video or audio diaries and organizing them for later review. The goal is to build a simple PWA (Progressive Web App) that runs on desktop or mobile.

## Core Features
- Record video or audio in the browser
- Automatically transcribe entries using Whisper
- Add tags or notes to each entry
- Search entries by text, tag, or date
- Replay previous logs

The project uses React and TailwindCSS for the frontend, and FastAPI with Whisper for the backend.

## Directory Structure
- `frontend/` – React application
- `backend/` – FastAPI services and transcription logic

## Getting Started
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd videologs
   ```
2. Install backend dependencies (including testing tools):
   ```sh
   pip install -r backend/requirements-dev.txt
   ```
3. Start the FastAPI server in development mode (runs at `http://localhost:8000`):
   ```sh
   uvicorn backend.main:app --reload
   ```
   The command is the same on Windows—open PowerShell and run `uvicorn` there.
   Once running, the interactive API docs are available at `http://localhost:8000/docs`.
   Leave this process running. In a **separate terminal window** (or a second
   PowerShell window) you can send requests to the API using `curl` as shown
   below.
4. Set up the React frontend:
   ```sh
   cd frontend/videologs
   npm install
   ```
5. Launch the React development server and open <http://localhost:3000>:
   ```sh
   npm start
   ```
6. With both servers running you can visit <http://localhost:3000> to record a video or audio note. Entries are stored only in memory and will be lost when the server restarts.

7. Create a new branch for your work:
   ```sh
   git checkout -b my-feature
   ```
8. Make changes and commit:
   ```sh
   git add .
   git commit -m "Describe your changes"
   git push origin my-feature
   ```

More documentation will be added as the project evolves.

## Basic API Usage
Once the server is running, you can create logs with a POST request and list them with a GET request.
The `curl` commands below work in PowerShell as well (curl is an alias for `Invoke-WebRequest`).


Create a log entry:
```sh
curl -X POST -H "Content-Type: application/json" \
    -d '{"content": "First entry", "tags": ["test"]}' \
    http://localhost:8000/logs
```
List log entries:
```sh
curl http://localhost:8000/logs
```


## Testing the Log API
After installing the development requirements you can run the included `pytest` suite. Ensure the repository root is on your `PYTHONPATH` so the `backend` package can be imported:

```sh
pip install -r backend/requirements-dev.txt
PYTHONPATH=. pytest -q
```
The tests create a log entry using the API and confirm it is returned when listing logs.

