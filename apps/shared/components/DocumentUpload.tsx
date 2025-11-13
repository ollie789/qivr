import React, { useState, useRef, useCallback } from 'react';
import { documentService } from '../services/documentService';
import type { DocumentResponse } from '../services/documentService';

interface DocumentUploadProps {
  patientId?: string;
  appointmentId?: string;
  onUploadComplete?: (document: DocumentResponse) => void;
  onError?: (error: string) => void;
  allowedTypes?: string[];
  maxSize?: number;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  response?: DocumentResponse;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  patientId,
  appointmentId,
  onUploadComplete,
  onError,
  className = '',
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('Medical Record');
  const [description, setDescription] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    const newUploadingFiles = new Map(uploadingFiles);

    for (const file of files) {
      // Validate file
      const validation = documentService.validateFile(file);
      if (!validation.isValid) {
        onError?.(validation.error || 'Invalid file');
        continue;
      }

      const fileId = `${file.name}-${Date.now()}`;
      newUploadingFiles.set(fileId, {
        file,
        progress: 0,
        status: 'pending',
      });

      // Start upload
      uploadFile(fileId, file, newUploadingFiles);
    }

    setUploadingFiles(newUploadingFiles);
  };

  const uploadFile = async (
    fileId: string,
    file: File,
    filesMap: Map<string, UploadingFile>
  ) => {
    try {
      // Update status to uploading
      filesMap.set(fileId, {
        ...filesMap.get(fileId)!,
        status: 'uploading',
      });
      setUploadingFiles(new Map(filesMap));

      let response: DocumentResponse;

      if (patientId) {
        response = await documentService.uploadPatientDocument(file, patientId, {
          documentType,
          description: description || undefined,
          onUploadProgress: (progressEvent: any) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            
            setUploadingFiles((prev) => {
              const newMap = new Map(prev);
              const fileData = newMap.get(fileId);
              if (fileData) {
                newMap.set(fileId, { ...fileData, progress });
              }
              return newMap;
            });
          },
        });
      } else if (appointmentId) {
        response = await documentService.uploadAppointmentDocument(file, appointmentId, {
          documentType,
          description: description || undefined,
          onUploadProgress: (progressEvent: any) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            
            setUploadingFiles((prev) => {
              const newMap = new Map(prev);
              const fileData = newMap.get(fileId);
              if (fileData) {
                newMap.set(fileId, { ...fileData, progress });
              }
              return newMap;
            });
          },
        });
      } else {
        throw new Error('Either patientId or appointmentId is required');
      }

      // Update status to success
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileId, {
          ...newMap.get(fileId)!,
          status: 'success',
          progress: 100,
          response,
        });
        return newMap;
      });

      onUploadComplete?.(response);

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }, 3000);
    } catch (error: any) {
      // Update status to error
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileId, {
          ...newMap.get(fileId)!,
          status: 'error',
          error: error.message || 'Upload failed',
        });
        return newMap;
      });

      onError?.(error.message || 'Upload failed');
    }
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  return (
    <div className={`document-upload ${className}`}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="Medical Record">Medical Record</option>
          <option value="Lab Result">Lab Result</option>
          <option value="Prescription">Prescription</option>
          <option value="Insurance">Insurance</option>
          <option value="Consent Form">Consent Form</option>
          <option value="Referral">Referral</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.csv,.xls,.xlsx"
        />

        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Click to upload
            </button>
            {' or drag and drop'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPG, PNG, DOC, DOCX, TXT, CSV, XLS, XLSX up to 10MB
          </p>
        </div>
      </div>

      {/* Upload Progress List */}
      {uploadingFiles.size > 0 && (
        <div className="mt-4 space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileId, fileData]) => (
            <div
              key={fileId}
              className="bg-white rounded-lg border border-gray-200 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {fileData.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {documentService.formatFileSize(fileData.file.size)}
                  </span>
                </div>
                {fileData.status === 'error' && (
                  <button
                    onClick={() => removeFile(fileId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {fileData.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${fileData.progress}%` }}
                  />
                </div>
              )}

              {fileData.status === 'success' && (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Upload complete</span>
                </div>
              )}

              {fileData.status === 'error' && (
                <div className="flex items-center text-red-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">{fileData.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
