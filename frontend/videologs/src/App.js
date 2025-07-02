import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    fetch('http://localhost:8000/logs')
      .then(res => res.json())
      .then(setLogs)
      .catch(() => {});
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = handleStop;
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    setStatus('Uploading...');
    await fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData,
    });
    setStatus('');
    setRecording(false);
    fetch('http://localhost:8000/logs')
      .then(res => res.json())
      .then(setLogs)
      .catch(() => {});
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="App">
      <h1>Video Logs</h1>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <p>{status}</p>
      <ul>
        {logs.map(log => (
          <li key={log.id}>
            <div>{log.content}</div>
            <small>{new Date(log.timestamp).toLocaleString()}</small>
            {log.media_path && (
              <audio controls src={`http://localhost:8000${log.media_path}`}></audio>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
