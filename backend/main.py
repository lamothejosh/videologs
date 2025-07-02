from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import json
from pathlib import Path



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

id_lock = asyncio.Lock()
BASE_DIR = Path(__file__).resolve().parent
LOG_PATH = BASE_DIR / "logs.json"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

class LogCreate(BaseModel):
    content: str
    tags: List[str] = []
    media_path: Optional[str] = None

class LogEntry(LogCreate):
    id: int
    timestamp: datetime

log_entries: List[LogEntry] = []
next_id = 1


def load_logs() -> None:
    global next_id
    if LOG_PATH.exists():
        data = json.loads(LOG_PATH.read_text())
        log_entries.clear()
        for item in data:
            item["timestamp"] = datetime.fromisoformat(item["timestamp"])
            log_entries.append(LogEntry(**item))
        next_id = max((e.id for e in log_entries), default=0) + 1


def save_logs() -> None:
    data = [
        {
            **entry.dict(),
            "timestamp": entry.timestamp.isoformat()
        }
        for entry in log_entries
    ]
    LOG_PATH.write_text(json.dumps(data, indent=2))


load_logs()

@app.get("/")
async def read_root():
    return {"message": "Welcome to your FastAPI site!"}



@app.post("/logs", response_model=LogEntry)
async def create_log(entry: LogCreate):
    global next_id
    async with id_lock:
        log = LogEntry(
            id=next_id,
            content=entry.content,
            tags=entry.tags,
            media_path=entry.media_path,
            timestamp=datetime.now(timezone.utc),
        )
        log_entries.append(log)
        next_id += 1
    save_logs()

    return log

@app.get("/logs", response_model=List[LogEntry])
async def list_logs():
    return log_entries



async def transcribe_media(path: Path) -> str:
    """Placeholder transcription function."""
    # TODO: integrate Whisper for real transcription
    return f"Transcription for {path.name}"


@app.post("/upload", response_model=LogEntry)
async def upload_media(file: UploadFile = File(...)):
    filename = f"{int(datetime.now().timestamp())}_{file.filename}"
    dest = UPLOAD_DIR / filename
    with dest.open("wb") as out_file:
        out_file.write(await file.read())

    transcript = await transcribe_media(dest)
    entry = LogCreate(content=transcript, tags=[], media_path=f"/uploads/{filename}")
    log = await create_log(entry)
    return log

