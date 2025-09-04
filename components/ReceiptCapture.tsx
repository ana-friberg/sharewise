"use client";
import { useState, useRef } from 'react';

interface ReceiptData {
  storeName: string;
  totalAmount: number;
}

interface ReceiptCaptureProps {
  onReceiptProcessed: (data: ReceiptData) => void;
}

export default function ReceiptCapture({ onReceiptProcessed }: ReceiptCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous messages
    setError(null);
    setSuccessMessage(null);

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setIsProcessing(true);

    try {
      // Convert to base64
      const base64Image = await convertToBase64(file);

      // Send to API
      const response = await fetch('/api/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        }),
      });

      const result = await response.json();

      if (result.success) {
        onReceiptProcessed(result.data);
        setError(null);
        setSuccessMessage(`✅ Receipt processed successfully using ${result.usedModel || 'AI model'}! Store: ${result.data.storeName}, Amount: ₪${result.data.totalAmount}`);
        
        // Clear the preview after successful processing
        setTimeout(() => {
          setPreview(null);
          setSuccessMessage(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 4000);
      } else {
        // Handle different error types
        if (result.code === 'RATE_LIMIT_EXCEEDED') {
          setError('AI models are currently busy. Please wait a few minutes and try again.');
        } else if (result.code === 'ALL_MODELS_FAILED') {
          setError('All AI models are temporarily unavailable. Please enter details manually below.');
        } else if (result.code === 'INVALID_API_KEY') {
          setError('API configuration error. Please contact support.');
        } else {
          setError(result.error || 'Failed to process receipt. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    setError(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleManualEntry = () => {
    const storeName = prompt("Enter store name:");
    const amount = prompt("Enter total amount (numbers only):");
    if (storeName && amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        onReceiptProcessed({
          storeName: storeName.trim(),
          totalAmount: parsedAmount
        });
        setError(null);
        setPreview(null);
        setSuccessMessage('✅ Manual entry added successfully!');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        alert('Please enter a valid amount');
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-3 text-gray-800">📸 AI Receipt Scanner</h3>
      
      <div className="space-y-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Camera button */}
        <button
          onClick={handleCameraCapture}
          disabled={isProcessing}
          className="w-full bg-blue-500 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Processing...
            </>
          ) : (
            <>
              📷 Take Photo
            </>
          )}
        </button>

        {/* Success message */}
        {successMessage && (
          <div className="p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800">✅ {successMessage}</p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Manual entry option when AI fails */}
        {error && (
          <button
            onClick={handleManualEntry}
            className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg text-sm font-medium"
          >
            Enter Details Manually
          </button>
        )}

        {/* Preview */}
        {preview && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Processing image...</p>
            <img
              src={preview}
              alt="Receipt preview"
              className="w-full h-32 object-contain border rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
