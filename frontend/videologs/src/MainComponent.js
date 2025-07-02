"use client";
import React from "react";

function MainComponent() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState(null);
  const [recordedBlob, setRecordedBlob] = React.useState(null);
  const [recordingType, setRecordingType] = React.useState("audio");
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [videoLogs, setVideoLogs] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [currentView, setCurrentView] = React.useState("record");
  const [playingLog, setPlayingLog] = React.useState(null);
  const [totalStorageKB, setTotalStorageKB] = React.useState(0);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [transcribingLogId, setTranscribingLogId] = React.useState(null);

  const videoRef = React.useRef(null);

  React.useEffect(() => {
    loadVideoLogs();
  }, []);

  const loadVideoLogs = async () => {
    try {
      const response = await fetch("/api/get-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`Failed to load logs: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setVideoLogs(data.videoLogs || []);
        setTotalStorageKB(data.totalStorageKB);
      }
    } catch (err) {
      console.error("Error loading logs:", err);
      setError("Failed to load video logs");
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const constraints =
        recordingType === "video"
          ? { video: true, audio: true }
          : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (recordingType === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recordingType === "video" ? "video/webm" : "audio/webm",
        });
        setRecordedBlob(blob);

        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        "Failed to start recording. Please check your camera/microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;

          const response = await fetch("/api/save-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: base64Data,
              title: title || "Untitled Entry",
              tags: tags,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save: ${response.status}`);
          }

          const result = await response.json();
          if (result.error) {
            setError(result.error);
          } else {
            setSuccess("Entry saved successfully!");
            setTitle("");
            setTags("");
            setRecordedBlob(null);
            loadVideoLogs();
          }
        } catch (err) {
          console.error("Error saving recording:", err);
          setError("Failed to save recording");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(recordedBlob);
    } catch (err) {
      console.error("Error processing recording:", err);
      setError("Failed to process recording");
      setIsUploading(false);
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setTitle("");
    setTags("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSearch = () => {
    loadVideoLogs();
  };

  const playMedia = (log) => {
    setPlayingLog(log);
  };

  const closePlayer = () => {
    setPlayingLog(null);
  };

  const deleteLog = async (logId, logTitle) => {
    if (
      !confirm(`Delete "${logTitle || "Untitled"}"? This cannot be undone.`)
    ) {
      return;
    }

    try {
      const response = await fetch("/api/delete-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Note deleted successfully");
        loadVideoLogs();
        if (playingLog && playingLog.id === logId) {
          setPlayingLog(null);
        }
      }
    } catch (err) {
      console.error("Error deleting log:", err);
      setError("Failed to delete note");
    }
  };

  const formatFileSize = (bytes) => {
    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;

    if (bytes >= GB) {
      return `${(bytes / GB).toFixed(2)} GB`;
    } else if (bytes >= MB) {
      return `${(bytes / MB).toFixed(2)} MB`;
    } else if (bytes >= KB) {
      return `${(bytes / KB).toFixed(2)} KB`;
    } else {
      return `${bytes} B`;
    }
  };

  const transcribeLog = async (logId, logTitle) => {
    setIsTranscribing(true);
    setTranscribingLogId(logId);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to transcribe: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          `AI transcription completed for "${logTitle || "Untitled"}"`
        );
        loadVideoLogs();
      }
    } catch (err) {
      console.error("Error transcribing:", err);
      setError("Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
      setTranscribingLogId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] font-sf-pro">
      <div className="bg-white border-b border-[#c6c6c8]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium text-black">Notes</h1>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentView("record")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === "record"
                    ? "bg-[#007aff] text-white"
                    : "text-[#007aff] hover:bg-[#f0f0f0]"
                }`}
              >
                Record
              </button>
              <button
                onClick={() => setCurrentView("logs")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === "logs"
                    ? "bg-[#007aff] text-white"
                    : "text-[#007aff] hover:bg-[#f0f0f0]"
                }`}
              >
                All Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-3 p-3 bg-[#ffebee] border border-[#ffcdd2] rounded-lg text-[#c62828] text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 p-3 bg-[#e8f5e8] border border-[#c8e6c9] rounded-lg text-[#2e7d32] text-sm">
            {success}
          </div>
        )}

        {currentView === "record" ? (
          <div className="bg-white rounded-lg border border-[#c6c6c8] p-4">
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setRecordingType("audio")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  recordingType === "audio"
                    ? "bg-[#007aff] text-white"
                    : "bg-[#f0f0f0] text-black hover:bg-[#e0e0e0]"
                }`}
              >
                Audio
              </button>
              <button
                onClick={() => setRecordingType("video")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  recordingType === "video"
                    ? "bg-[#007aff] text-white"
                    : "bg-[#f0f0f0] text-black hover:bg-[#e0e0e0]"
                }`}
              >
                Video
              </button>
            </div>

            {recordingType === "video" && (
              <div className="mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full max-w-sm mx-auto rounded-lg bg-black"
                  style={{ display: isRecording ? "block" : "none" }}
                />
              </div>
            )}

            <div className="text-center">
              {!isRecording && !recordedBlob && (
                <button
                  onClick={startRecording}
                  className="bg-[#ff3b30] hover:bg-[#d70015] text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
                >
                  Start Recording
                </button>
              )}

              {isRecording && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-[#ff3b30]">
                    <div className="w-2 h-2 bg-[#ff3b30] rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording...</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="bg-[#8e8e93] hover:bg-[#6d6d70] text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
                  >
                    Stop
                  </button>
                </div>
              )}

              {recordedBlob && (
                <div className="space-y-3">
                  <div className="text-[#34c759] text-sm font-medium">
                    Recording completed
                  </div>

                  <div className="space-y-3 max-w-sm mx-auto">
                    <input
                      type="text"
                      placeholder="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-[#c6c6c8] rounded-md text-sm focus:outline-none focus:border-[#007aff]"
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3 py-2 border border-[#c6c6c8] rounded-md text-sm focus:outline-none focus:border-[#007aff]"
                    />
                  </div>

                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={discardRecording}
                      className="bg-[#8e8e93] hover:bg-[#6d6d70] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={saveRecording}
                      disabled={isUploading}
                      className="bg-[#007aff] hover:bg-[#0051d5] disabled:bg-[#c6c6c8] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {isUploading ? "Saving & Transcribing..." : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-[#c6c6c8] p-3">
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#c6c6c8] rounded-md text-sm focus:outline-none focus:border-[#007aff]"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#007aff] hover:bg-[#0051d5] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Search
                </button>
              </div>
              {totalStorageKB > 0 && (
                <div className="text-xs text-[#8e8e93] flex items-center justify-between">
                  <span>{videoLogs.length} notes</span>
                  <span>Total storage: {formatFileSize(totalStorageKB)}</span>
                </div>
              )}
            </div>

            {videoLogs.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#c6c6c8] p-8 text-center">
                <div className="text-[#8e8e93] text-sm mb-3">No notes yet</div>
                <button
                  onClick={() => setCurrentView("record")}
                  className="bg-[#007aff] hover:bg-[#0051d5] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Create First Note
                </button>
              </div>
            ) : (
              videoLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-lg border border-[#c6c6c8] p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-black text-sm mb-1">
                        {log.title || "Untitled"}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs text-[#8e8e93]">
                        <span>{log.media_type}</span>
                        <span>{formatDate(log.created_at)}</span>
                        {log.file_size && (
                          <span>{formatFileSize(log.file_size)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => playMedia(log)}
                        className="bg-[#007aff] hover:bg-[#0051d5] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                      >
                        Play
                      </button>
                      <button
                        onClick={() => deleteLog(log.id, log.title)}
                        className="bg-[#ff3b30] hover:bg-[#d70015] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {log.transcript &&
                    log.transcript !==
                      "Transcription service temporarily unavailable" &&
                    log.transcript !== "Transcription in progress..." && (
                      <div className="mb-2">
                        <p className="text-xs text-[#8e8e93] line-clamp-2">
                          {log.transcript.length > 100
                            ? log.transcript.substring(0, 100) + "..."
                            : log.transcript}
                        </p>
                      </div>
                    )}

                  {log.tags && log.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {log.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-[#f0f0f0] text-[#8e8e93] px-2 py-0.5 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {playingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#c6c6c8]">
              <h3 className="font-medium text-black">
                {playingLog.title || "Untitled"}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => deleteLog(playingLog.id, playingLog.title)}
                  className="bg-[#ff3b30] hover:bg-[#d70015] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={closePlayer}
                  className="text-[#8e8e93] hover:text-black text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto">
              {playingLog.media_type === "video" ? (
                <video
                  controls
                  autoPlay
                  className="w-full rounded-lg mb-4"
                  src={playingLog.media_url}
                />
              ) : (
                <audio
                  controls
                  autoPlay
                  className="w-full mb-4"
                  src={playingLog.media_url}
                />
              )}

              {playingLog.transcript &&
                playingLog.transcript !==
                  "Transcription service temporarily unavailable" &&
                playingLog.transcript !== "Transcription in progress..." && (
                  <div className="mt-4 p-3 bg-[#f8f8f8] rounded-lg">
                    <h4 className="text-sm font-medium text-black mb-2">
                      Transcript
                    </h4>
                    <p className="text-sm text-[#333] leading-relaxed">
                      {playingLog.transcript}
                    </p>
                  </div>
                )}

              <div className="mt-3 text-xs text-[#8e8e93] flex items-center justify-between">
                <span>{formatDate(playingLog.created_at)}</span>
                {playingLog.file_size && (
                  <span>{formatFileSize(playingLog.file_size)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;
