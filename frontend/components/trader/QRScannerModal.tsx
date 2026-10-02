import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '@/lib/api';

interface QRScannerModalProps {
    onClose: () => void;
    onSuccess: (reservationData: any) => void;
}

export default function QRScannerModal({ onClose, onSuccess }: QRScannerModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async (data: string) => {
        if (!data || isProcessing) return;
        
        setIsProcessing(true);
        setError(null);
        
        try {
            // Data could be a URL or just the reservation_code.
            // If it's the raw code:
            const code = data.trim();
            
            // To fetch the reservation, we might need an endpoint like /api/trader/reservations/scan?code=...
            // Let's assume we can search reservations by code in the frontend since we have them in the state,
            // but fetching from backend is safer.
            // For now, let's just pass the code to the parent and let it handle the logic.
            onSuccess(code);
        } catch (err: any) {
            console.error('Scan processing error:', err);
            setError('Failed to process QR code. Try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight">Scan Receipt</h3>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="p-6 relative bg-black flex items-center justify-center min-h-[300px]">
                    {isProcessing ? (
                        <div className="flex flex-col items-center text-white">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            <p className="text-sm font-bold tracking-widest uppercase">Verifying...</p>
                        </div>
                    ) : (
                        <Scanner 
                            onScan={(result) => handleScan(result[0]?.rawValue)}
                            onError={(error) => console.log('Scanner error:', error)}
                            components={{
                                onOff: true,
                                torch: true,
                                zoom: true,
                                finder: true,
                            }}
                            styles={{
                                container: { width: '100%', height: '100%' },
                            }}
                        />
                    )}

                    {error && !isProcessing && (
                        <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white text-xs font-bold p-3 rounded-xl text-center uppercase tracking-widest shadow-lg">
                            {error}
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-gray-50 text-center">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Center QR Code inside the frame</p>
                </div>
            </div>
        </div>
    );
}
