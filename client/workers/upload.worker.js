const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

self.onmessage = async (e) => {
  const { file, uploadId, token } = e.data;
  const chunks = Math.ceil(file.size / CHUNK_SIZE);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i);
    formData.append('totalChunks', chunks);

    try {
      const response = await fetch('http://localhost:3001/api/upload/chunk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed for chunk ${i}: ${response.status} - ${errorText}`);
      }

      self.postMessage({
        type: 'progress',
        progress: ((i + 1) / chunks) * 100,
        chunkIndex: i
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message,
        chunkIndex: i
      });
      return;
    }
  }

  try {
    const response = await fetch('http://localhost:3001/api/upload/complete', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        uploadId,
        fileName: file.name
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Complete upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to complete upload: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    self.postMessage({ 
      type: 'complete',
      data: result
    });
  } catch (error) {
    console.error('Complete upload error:', error);
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}; 