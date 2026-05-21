import React, { useState } from 'react';
import { Download, X, ScanFace, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';

interface ReceiptModalProps {
    reservation: any;
    onClose: () => void;
}

export default function ReceiptModal({ reservation, onClose }: ReceiptModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const response = await api.get(`/reservations/${reservation.id}/receipt?action=download`, {
                responseType: 'blob', // Important for downloading files
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt_${reservation.reservation_code}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading receipt:', error);
            alert('Failed to download receipt. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    // Use an external QR generator for the modal UI to save bundle size
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reservation.reservation_code}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-black text-gray-900 text-lg tracking-tight">E-Receipt</h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">#{reservation.reservation_code}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Receipt Content (Scrollable) */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* Status & QR */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-1">KES {Number(reservation.total_amount).toLocaleString()}</h2>
                        <p className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">{reservation.status}</p>

                        <div className="mt-8 p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
                            <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 mb-3" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <ScanFace className="w-3 h-3" />
                                Scan to Verify
                            </p>
                            <p className="text-lg font-black text-gray-900 mt-1 tracking-widest">{reservation.reservation_code}</p>
                        </div>
                    </div>

                    {/* Details List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date</div>
                            <div className="text-sm font-bold text-gray-900">{format(new Date(reservation.created_at), 'MMM dd, yyyy HH:mm')}</div>
                        </div>

                        <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Item</div>
                            <div className="text-sm font-bold text-gray-900 text-right">
                                {reservation.product?.name} <span className="text-gray-400">x{reservation.quantity}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trader</div>
                            <div className="text-sm font-bold text-gray-900 text-right">
                                {reservation.trader?.business_name}
                                <div className="text-xs text-gray-500 font-normal">{reservation.trader?.market?.name}</div>
                            </div>
                        </div>
                        
                        {reservation.delivery_option ? (
                            <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Delivery Fee</div>
                                <div className="text-sm font-bold text-gray-900 text-right">KES {Number(reservation.delivery_fee || 0).toLocaleString()}</div>
                            </div>
                        ) : null}
                    </div>

                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <span className="animate-pulse">Generating PDF...</span>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download PDF Receipt
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
