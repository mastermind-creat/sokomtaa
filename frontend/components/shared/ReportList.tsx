'use client';

import React from 'react';
import { 
    FileText, 
    Download, 
    Trash2, 
    Calendar, 
    FileSpreadsheet, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, Report } from '@/types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportList() {
    const queryClient = useQueryClient();

    const { data: reportsData, isLoading } = useQuery<ApiResponse<any>>({
        queryKey: ['reports'],
        queryFn: () => api.get('/reports'),
    });

    const reports = Array.isArray(reportsData) ? reportsData : reportsData?.data || [];

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/reports/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
    });

    const getIcon = (type: string, format: string) => {
        if (format === 'xlsx' || format === 'csv') return <FileSpreadsheet className="text-green-600" size={24} />;
        return <FileText className="text-rose-600" size={24} />;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-brand-600" size={40} />
                <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Loading Reports Archive...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {reports.length > 0 ? (
                    reports.map((report: Report, index: number) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group"
                        >
                            <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center shrink-0">
                                {getIcon(report.type, report.format)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-green-950 uppercase tracking-tight truncate">
                                    {report.title}
                                </h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                                        <Calendar size={12} />
                                        {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                                        {report.format}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 transition-opacity">
                                <button
                                    onClick={async () => {
                                        try {
                                            const blob = await api.get(`/reports/${report.id}/download`, { responseType: 'blob' });
                                            const url = window.URL.createObjectURL(new Blob([blob as any]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}.${report.format}`);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                        } catch (error) {
                                            console.error('Download failed', error);
                                            alert('Failed to download report.');
                                        }
                                    }}
                                    className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all shadow-sm"
                                    title="Download"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this report?')) {
                                            deleteMutation.mutate(report.id);
                                        }
                                    }}
                                    className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-20 text-center space-y-4 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-neutral-200 mx-auto shadow-sm">
                            <Clock size={40} />
                        </div>
                        <div>
                            <h5 className="text-lg font-black text-green-950 uppercase tracking-tight">No Reports Found</h5>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
                                Generated reports will appear here for download
                            </p>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
