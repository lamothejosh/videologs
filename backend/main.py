from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

id_lock = asyncio.Lock()

class LogCreate(BaseModel):
    content: str
    tags: List[str] = []

class LogEntry(LogCreate):
    id: int
    timestamp: datetime

log_entries: List[LogEntry] = []
next_id = 1

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
            timestamp=datetime.now(timezone.utc),
        )
        log_entries.append(log)
        next_id += 1

    return log

@app.get("/logs", response_model=List[LogEntry])
async def list_logs():
    return log_entries



