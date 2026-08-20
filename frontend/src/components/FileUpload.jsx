import axios from 'axios';
import { useState } from 'react';
import { API_BASE_URL } from '../api/config';

const FileUpload = ({ onUploadSuccess, userAddress }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus('');
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setUploading(true);
        setStatus('Uploading to IPFS...');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userAddress', userAddress || 'anonymous');

            const response = await axios.post(`${API_BASE_URL}/ipfs/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setStatus(`Upload successful! CID: ${response.data.cid}`);
            if (onUploadSuccess) {
                onUploadSuccess(response.data.cid);
            }
            setFile(null);
        } catch (error) {
            console.error('Upload failed:', error);
            setStatus('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                    Upload Identity Proof
                </label>
                <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer disabled:opacity-50"
                />
            </div>
            
            {file && (
                <div className="text-xs text-gray-500">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all text-sm"
            >
                {uploading ? status : 'Upload to IPFS'}
            </button>

            {status && !uploading && (
                <div className={`text-xs p-3 rounded-lg ${
                    status.includes('successful') 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
