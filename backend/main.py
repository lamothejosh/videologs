from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from datetime import datetime

app = FastAPI()

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
    log = LogEntry(id=next_id, content=entry.content, tags=entry.tags, timestamp=datetime.utcnow())
    next_id += 1
    log_entries.append(log)
    return log

@app.get("/logs", response_model=List[LogEntry])
async def list_logs():
    return log_entries
