import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { documentApi } from '../services/documentApi';
import apiClient from '../lib/api-client';

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  status: string;
  extractedPatientName?: string;
  extractedDob?: string;
  confidenceScore?: number;
  createdAt: string;
}

interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    size: string;
  }>;
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/patients/${id}/record`);
      return res.data as PatientRecord;
    },
    enabled: !!id,
  });

  const { data: documents, isLoading: docsLoading, refetch } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentApi.list({ patientId: id }),
    enabled: !!id,
  });

  const handleUpload = async (file: File) => {
    if (!id) return;
    await documentApi.upload({ file, patientId: id });
    refetch();
    setShowUpload(false);
  };

  const handleDownload = async (docId: string) => {
    const { url } = await documentApi.getDownloadUrl(docId);
    window.open(url, '_blank');
  };

  if (patientLoading || docsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!patient) {
    return <div className="p-6">Patient not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/patients')} className="text-blue-600 hover:text-blue-800 mb-4">
          ← Back to Patients
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {patient.firstName} {patient.lastName}
        </h1>
        <p className="text-gray-600">{patient.email}</p>
      </div>

      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Date of Birth:</span>
            <span className="ml-2 font-medium">{patient.dateOfBirth || 'Not provided'}</span>
          </div>
          <div>
            <span className="text-gray-600">Phone:</span>
            <span className="ml-2 font-medium">{patient.phone || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Medical Documents</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Document
          </button>
        </div>

        {/* Documents List */}
        {documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{doc.fileName}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {doc.documentType}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        doc.status === 'ready' ? 'bg-green-100 text-green-800' :
                        doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.status}
                      </span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    {doc.extractedPatientName && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Extracted:</span> {doc.extractedPatientName}
                        {doc.extractedDob && ` • DOB: ${doc.extractedDob}`}
                        {doc.confidenceScore && ` • ${doc.confidenceScore}% confidence`}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.id);
                    }}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No documents uploaded yet
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              className="w-full p-2 border rounded"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedDoc.fileName}</h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium">{selectedDoc.documentType}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{selectedDoc.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Uploaded:</span>
                <span className="ml-2 font-medium">
                  {new Date(selectedDoc.createdAt).toLocaleString()}
                </span>
              </div>
              
              {selectedDoc.extractedPatientName && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">OCR Extracted Data</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Patient Name:</span>
                      <span className="ml-2">{selectedDoc.extractedPatientName}</span>
                    </div>
                    {selectedDoc.extractedDob && (
                      <div>
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="ml-2">{selectedDoc.extractedDob}</span>
                      </div>
                    )}
                    {selectedDoc.confidenceScore && (
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <span className="ml-2">{selectedDoc.confidenceScore}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handleDownload(selectedDoc.id)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
