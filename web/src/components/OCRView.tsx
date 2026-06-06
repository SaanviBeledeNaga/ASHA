import React, { useState } from 'react';

export default function OCRView() {
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'uploading' | 'scanning' | 'success'>('idle');
  const [ocrData, setOcrData] = useState({
    name: '',
    dob: '',
    gender: '',
    aadhaar_number: '',
    address: ''
  });

  const handleOcrSimulate = () => {
    setOcrStatus('uploading');
    setTimeout(() => {
      setOcrStatus('scanning');
      setTimeout(() => {
        setOcrStatus('success');
        setOcrData({
          name: 'Ramesh Kumar',
          dob: '12-04-1995',
          gender: 'Male',
          aadhaar_number: 'XXXX-XXXX-1234',
          address: 'Hyderabad'
        });
      }, 2000);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <h2>Secure Document Upload</h2>
        <p className="text-secondary">Upload Aadhaar / PAN for smart data extraction</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Upload Zone */}
        <div className="card flex flex-col items-center justify-center p-8 border-dashed" style={{ borderStyle: 'dashed', borderWidth: '2px', minHeight: '300px' }}>
          {ocrStatus === 'idle' && (
            <div className="text-center">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
              <p className="text-secondary mb-4">Click below to simulate document scan</p>
              <button className="btn-secondary" onClick={handleOcrSimulate}>Simulate Google Vision OCR</button>
            </div>
          )}
          
          {ocrStatus === 'uploading' && (
            <div className="text-center">
              <div className="mb-4" style={{ fontSize: '3rem' }}>⏳</div>
              <h4 className="text-primary">Uploading image...</h4>
            </div>
          )}

          {ocrStatus === 'scanning' && (
            <div className="text-center">
              <div className="mb-4 animate-bounce" style={{ fontSize: '3rem' }}>🔍</div>
              <h4 style={{ color: 'var(--warning-color)' }}>Extracting entities via Gemini...</h4>
            </div>
          )}

          {ocrStatus === 'success' && (
            <div className="text-center">
              <div className="mb-4" style={{ fontSize: '4rem' }}>✅</div>
              <h4 style={{ color: 'var(--success-color)' }}>Extraction Complete!</h4>
              <button className="mt-4 text-primary" onClick={() => setOcrStatus('idle')} style={{ textDecoration: 'underline', background: 'none', border: 'none' }}>Scan another document</button>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="card space-y-4">
          <h4 className="border-b pb-2">Extracted Information</h4>
          
          <div>
            <label className="text-secondary text-sm font-bold">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={ocrData.name} 
              onChange={e => setOcrData({...ocrData, name: e.target.value})}
              placeholder="Auto-filled..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-secondary text-sm font-bold">Date of Birth</label>
              <input 
                type="text" 
                className="input-field" 
                value={ocrData.dob} 
                onChange={e => setOcrData({...ocrData, dob: e.target.value})}
                placeholder="Auto-filled..."
              />
            </div>
            <div>
              <label className="text-secondary text-sm font-bold">Gender</label>
              <input 
                type="text" 
                className="input-field" 
                value={ocrData.gender} 
                onChange={e => setOcrData({...ocrData, gender: e.target.value})}
                placeholder="Auto-filled..."
              />
            </div>
          </div>

          <div>
            <label className="text-secondary text-sm font-bold">ID Number (Aadhaar/PAN)</label>
            <input 
              type="text" 
              className="input-field" 
              value={ocrData.aadhaar_number} 
              onChange={e => setOcrData({...ocrData, aadhaar_number: e.target.value})}
              placeholder="Auto-filled..."
            />
          </div>

          <div>
            <label className="text-secondary text-sm font-bold">Address</label>
            <textarea 
              className="input-field resize-none" 
              rows={3}
              value={ocrData.address} 
              onChange={e => setOcrData({...ocrData, address: e.target.value})}
              placeholder="Auto-filled..."
            />
          </div>

          <div className="pt-4 flex justify-end border-t mt-4">
            <button className="btn-primary" disabled={!ocrData.name}>Save Verified Profile</button>
          </div>
        </div>

      </div>
    </div>
  );
}
