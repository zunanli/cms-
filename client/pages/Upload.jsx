import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { PermissionButton } from '../components/PermissionButton';

const Upload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const workerRef = useRef(null);
  const { accessToken } = useSelector(state => state.auth);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setUploadProgress(0);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;

    const uploadId = uuidv4();
    
    try {
      // Create a new Web Worker
      workerRef.current = new Worker(new URL('../workers/upload.worker.js', import.meta.url));
      
      // Listen for messages from the worker
      workerRef.current.onmessage = (event) => {
        const { type, progress, error } = event.data;
        
        switch (type) {
          case 'progress':
            setUploadProgress(progress);
            break;
          case 'error':
            setError(error);
            break;
          case 'complete':
            setUploadProgress(100);
            setFile(null); // Reset file after successful upload
            break;
          default:
            break;
        }
      };

      // Start the upload
      workerRef.current.postMessage({
        file,
        uploadId,
        token: accessToken
      });
    } catch (err) {
      setError('Upload failed: ' + err.message);
    }
  };

  // Cleanup worker on unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">File Upload</h1>
      <div className="bg-white shadow-md rounded p-6">
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Progress: {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-4 flex gap-4">
          <PermissionButton
            requiredRoles={['admin']}
            requiredPermissions={['write']}
            onClick={handleUpload}
            disabled={!file || uploadProgress > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
              disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {uploadProgress > 0 ? 'Uploading...' : 'Upload File'}
          </PermissionButton>

          <PermissionButton
            requiredRoles={['admin']}
            requiredPermissions={['write', 'delete']}
            onClick={() => {/* 删除逻辑 */}}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
              disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            Delete File
          </PermissionButton>
        </div>
      </div>
    </div>
  );
};

export default Upload; 