'use client';

import React, { useState } from 'react';
import { 
    MapPin, 
    Plus, 
    ChevronRight, 
    Search, 
    Filter,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Globe,
    Navigation,
    Building2,
    X,
    MoreVertical
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, Region, Center } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/uiStore';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils';

export default function LocationsPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'regions' | 'centers'>('regions');
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Region | Center | null>(null);

    React.useEffect(() => {
        setPageTitle('Location Management');
    }, [setPageTitle]);

    // Fetch Regions
    const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
        queryKey: ['admin-regions'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<Region[]>>('/admin/regions');
            return res.data;
        }
    });

    // Fetch Centers
    const { data: centers, isLoading: centersLoading } = useQuery<Center[]>({
        queryKey: ['admin-centers'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<Center[]>>('/admin/centers');
            return res.data;
        }
    });


    // Mutations
    const regionMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingItem) {
                return api.put(`/admin/regions/${editingItem.id}`, data);
            }
            return api.post('/admin/regions', data);
        },
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin-regions'] });
            toast.success(res.message || `Region ${editingItem ? 'updated' : 'created'} successfully`);
            setShowForm(false);
            setEditingItem(null);
        },
        onError: (err: any) => {
            toast.error(handleApiError(err));
        }
    });

    const centerMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingItem) {
                return api.put(`/admin/centers/${editingItem.id}`, data);
            }
            return api.post('/admin/centers', data);
        },
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
            toast.success(res.message || `Center ${editingItem ? 'updated' : 'created'} successfully`);
            setShowForm(false);
            setEditingItem(null);
        },
        onError: (err: any) => {
            toast.error(handleApiError(err));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ type, id }: { type: 'regions' | 'centers', id: number }) => {
            return api.delete(`/admin/${type}/${id}`);
        },
        onSuccess: (res: any, variables) => {
            queryClient.invalidateQueries({ queryKey: [`admin-${variables.type}`] });
            toast.success(res.message || 'Deleted successfully');
        },
        onError: (err: any) => {
            toast.error(handleApiError(err));
        }
    });


    const filteredRegions = regions?.filter((r: Region) => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCenters = centers?.filter((c: Center) => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.region?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-green-950 tracking-tight">Geographical Hub</h2>
                    <p className="text-text-secondary text-sm font-medium">Manage regions, urban centers, and market clusters.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingItem(null);
                        setShowForm(true);
                    }}
                    className="h-14 px-8 bg-brand-600 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-brand-900/10 active:scale-95 transition-all"
                >
                    <Plus size={20} />
                    Add New {activeTab === 'regions' ? 'Region' : 'Center'}
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex bg-neutral-100/50 p-1.5 rounded-[1.5rem] w-full lg:w-fit">
                    <button 
                        onClick={() => setActiveTab('regions')}
                        className={`flex-1 lg:flex-none h-12 px-8 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'regions' ? 'bg-white text-brand-600 shadow-sm' : 'text-text-muted hover:text-green-950'}`}
                    >
                        <Globe size={16} />
                        Regions
                    </button>
                    <button 
                        onClick={() => setActiveTab('centers')}
                        className={`flex-1 lg:flex-none h-12 px-8 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'centers' ? 'bg-white text-brand-600 shadow-sm' : 'text-text-muted hover:text-green-950'}`}
                    >
                        <Navigation size={16} />
                        Centers
                    </button>
                </div>

                <div className="relative w-full lg:w-[400px] group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-[1.25rem] text-sm font-medium focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Data Grid */}
            {(regionsLoading || centersLoading) ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-brand-600" size={40} />
                    <p className="text-xs font-black text-text-muted uppercase tracking-widest">Loading Locations...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeTab === 'regions' ? (
                        filteredRegions?.map((region) => (
                            <LocationCard 
                                key={region.id}
                                title={region.name}
                                subtitle={`${region.centers_count || 0} Centers`}
                                icon={Globe}
                                onEdit={() => {
                                    setEditingItem(region);
                                    setShowForm(true);
                                }}
                                onDelete={() => deleteMutation.mutate({ type: 'regions', id: region.id })}
                                description={region.description}
                                isActive={region.is_active}
                            />
                        ))
                    ) : (
                        filteredCenters?.map((center) => (
                            <LocationCard 
                                key={center.id}
                                title={center.name}
                                subtitle={center.region?.name || 'No Region'}
                                icon={Navigation}
                                onEdit={() => {
                                    setEditingItem(center);
                                    setShowForm(true);
                                }}
                                onDelete={() => deleteMutation.mutate({ type: 'centers', id: center.id })}
                                description={center.description}
                                isActive={center.is_active}
                                badge={`${center.markets_count || 0} Markets`}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Modal Form */}
            <AnimatePresence>
                {showForm && (
                    <LocationModal 
                        type={activeTab}
                        item={editingItem}
                        regions={regions || []}
                        onClose={() => setShowForm(false)}
                        onSubmit={(data) => {
                            if (activeTab === 'regions') regionMutation.mutate(data);
                            else centerMutation.mutate(data);
                        }}
                        isLoading={regionMutation.isPending || centerMutation.isPending}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface LocationCardProps {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    onEdit: () => void;
    onDelete: () => void;
    description?: string | null;
    isActive: boolean;
    badge?: string;
}

function LocationCard({ title, subtitle, icon: Icon, onEdit, onDelete, description, isActive, badge }: LocationCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-900/5 transition-all group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-[5rem] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                        <Icon size={28} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onEdit} className="p-2 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                            <Edit2 size={18} />
                        </button>
                        <button onClick={onDelete} className="p-2 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-xl font-black text-green-950 truncate">{title}</h4>
                        {badge && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg">
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-bold text-brand-600 uppercase tracking-widest">{subtitle}</p>
                </div>

                {description && (
                    <p className="text-sm text-text-secondary line-clamp-2 mb-6 flex-grow">{description}</p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                        {isActive ? 'Operational' : 'Inactive'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

interface LocationModalProps {
    type: 'regions' | 'centers';
    item?: Region | Center | null;
    regions: Region[];
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

function LocationModal({ type, item, regions, onClose, onSubmit, isLoading }: LocationModalProps) {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        region_id: item?.region_id || regions[0]?.id || '',
        is_active: item ? item.is_active : true
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-green-950/20 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-[540px] relative shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-bl-[10rem] -mr-32 -mt-32 opacity-50" />
                
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-green-950 tracking-tight">
                                {item ? 'Edit' : 'Create'} {type === 'regions' ? 'Region' : 'Center'}
                            </h3>
                            <p className="text-sm text-text-secondary font-medium">Enter details for the new geographical entry.</p>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-text-muted hover:text-green-950 transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => {
                        e.preventDefault();
                        const submitData = { ...formData };
                        // Remove region_id if we are creating a region
                        if (type === 'regions') {
                            delete (submitData as any).region_id;
                        }
                        onSubmit(submitData);
                    }}>

                        {type === 'centers' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-4">Select Region</label>
                                <select 
                                    value={formData.region_id}
                                    onChange={(e) => setFormData({...formData, region_id: e.target.value})}
                                    className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none text-sm font-bold"
                                >
                                    {regions.map((r: Region) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-4">Name</label>
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none text-sm font-bold"
                                placeholder={`e.g. ${type === 'regions' ? 'Westlands Sub-County' : 'Kangemi Center'}`}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-4">Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full h-32 p-6 bg-neutral-50 rounded-[2rem] border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none text-sm font-medium resize-none"
                                placeholder="Briefly describe this location..."
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl">
                            <input 
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                className="w-5 h-5 rounded-md border-gray-300 text-brand-600 focus:ring-brand-600"
                            />
                            <label htmlFor="is_active" className="text-xs font-bold text-green-950 uppercase tracking-widest cursor-pointer">
                                Mark as Operational / Active
                            </label>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-brand-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                            {item ? 'Update Entry' : 'Create Entry'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
