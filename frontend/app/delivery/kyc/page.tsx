'use client';

import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Car, CheckCircle2, Loader2, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

type UploadStep = 'id_document' | 'license_image' | 'vehicle_details' | 'review';

interface KycForm {
    id_front_url: string;
    id_back_url: string;
    face_verification_url: string;
    id_document_url: string;
    license_image_url: string;
    vehicle_type: string;
    license_plate: string;
    license_number: string;
    custom_vehicle_type?: string;
}

export default function RiderKycPage() {
    const { setPageTitle } = useUIStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<UploadStep>('id_document');
    const [form, setForm] = useState<KycForm>({
        id_front_url: '',
        id_back_url: '',
        face_verification_url: '',
        id_document_url: '',
        license_image_url: '',
        vehicle_type: 'motorcycle',
        license_plate: '',
        license_number: '',
        custom_vehicle_type: '',
    });
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    React.useEffect(() => {
        setPageTitle('KYC Verification');
    }, [setPageTitle]);

    // Fetch current profile so we can pre-fill and detect status
    const { data: profileData } = useQuery({
        queryKey: ['rider-kyc-profile'],
        queryFn: () => api.get<never, { data: any }>('/delivery/profile').then(r => r.data),
    });
    const profile = profileData;

    // If already verified, redirect away
    React.useEffect(() => {
        if (profile?.verification_status === 'verified') {
            router.replace('/delivery/dashboard');
        }
        if (profile) {
            const isStandard = ['motorcycle', 'bicycle', 'foot', 'handcart'].includes(profile.vehicle_type || '');
            setForm(f => ({
                ...f,
                vehicle_type: profile.vehicle_type || 'motorcycle',
                license_plate: profile.license_plate || '',
                license_number: profile.license_number || '',
                id_front_url: profile.id_front_url || '',
                id_back_url: profile.id_back_url || '',
                face_verification_url: profile.face_verification_url || '',
                id_document_url: profile.id_document_url || '',
                license_image_url: profile.license_image_url || '',
                custom_vehicle_type: isStandard ? '' : (profile.vehicle_type || ''),
            }));
        }
    }, [profile, router]);

    // Upload image — uses Cloudinary direct upload with backend-signed params.
    // Falls back to backend multipart upload if Cloudinary isn't configured.
    const uploadImage = async (file: File, field: string): Promise<string> => {
        setUploadingField(field);
        try {
            // 1. Get a signature for the 'kyc' folder
            const sigRes = await api.get<never, { data: any }>('/profile/cloudinary/sign', {
                params: { folder: 'kyc' }
            });

            // Backend is in local-fallback mode — upload via backend multipart
            if (sigRes.data?.error) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'kyc');
                const res = await api.post<never, { data: { url: string } }>(
                    '/profile/avatar', formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                return res.data?.url || '';
            }

            const { signature, timestamp, api_key, cloud_name, folder } = sigRes.data;

            // 2. Direct upload — use the exact folder the backend signed (no modification)
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);           // must match signature exactly
            formData.append('signature', signature);
            formData.append('timestamp', String(timestamp));
            formData.append('api_key', api_key);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
                { method: 'POST', body: formData }
            );
            const uploadData = await uploadRes.json();

            if (!uploadData.secure_url) {
                console.error('Cloudinary error:', uploadData);
                throw new Error(uploadData.error?.message || 'Upload failed');
            }
            return uploadData.secure_url;
        } finally {
            setUploadingField(null);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'id_front_url' | 'id_back_url' | 'face_verification_url' | 'id_document_url' | 'license_image_url') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 5MB.');
            return;
        }
        try {
            const url = await uploadImage(file, field);
            setForm(f => ({ ...f, [field]: url }));
            toast.success('Document uploaded successfully!');
        } catch {
            toast.error('Upload failed. Please try again.');
        }
    };

    const submitMutation = useMutation({
        mutationFn: () => api.post('/delivery/kyc', form),
        onSuccess: () => {
            toast.success('KYC documents submitted! An administrator will review them shortly.');
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
            queryClient.invalidateQueries({ queryKey: ['rider-kyc-profile'] });
            router.push('/delivery/dashboard');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
        },
    });

    const canSubmit = !!form.id_front_url && !!form.id_back_url && !!form.face_verification_url;

    const steps = [
        { key: 'id_document', label: 'National ID & Selfie', icon: FileText },
        { key: 'license_image', label: 'Licence', icon: Car },
        { key: 'vehicle_details', label: 'Vehicle', icon: Car },
        { key: 'review', label: 'Submit', icon: ShieldCheck },
    ];
    const stepIndex = steps.findIndex(s => s.key === step);

    const UploadBox = ({ field, label, hint }: { field: 'id_front_url' | 'id_back_url' | 'face_verification_url' | 'id_document_url' | 'license_image_url'; label: string; hint: string }) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const hasFile = !!form[field];
        const isUploading = uploadingField === field;

        return (
            <div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileChange(e, field)}
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                        'w-full h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all active:scale-95',
                        hasFile ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/30'
                    )}
                >
                    {isUploading ? (
                        <Loader2 size={32} className="animate-spin text-brand-600" />
                    ) : hasFile ? (
                        <>
                            <CheckCircle2 size={32} className="text-green-600" />
                            <span className="text-xs font-black text-green-700 uppercase tracking-widest">Uploaded ✓</span>
                            <span className="text-[9px] text-green-600 font-bold">Tap to replace</span>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                                <Upload size={22} />
                            </div>
                            <span className="text-xs font-black text-green-950 uppercase tracking-widest">{label}</span>
                            <span className="text-[9px] text-text-muted font-bold text-center max-w-[200px]">{hint}</span>
                        </>
                    )}
                </button>
                {hasFile && (
                    <img src={form[field]} alt="Preview" className="mt-3 w-full h-32 object-cover rounded-2xl border border-green-100" />
                )}
            </div>
        );
    };

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans max-w-xl mx-auto">
            {/* Header */}
            <div className="px-4 mb-8 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-text-muted hover:text-green-950 active:scale-95 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-green-950 uppercase tracking-tight">KYC Verification</h1>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Identity & Vehicle Documents</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="px-4 mb-8">
                <div className="flex items-center gap-0">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.key}>
                            <button
                                onClick={() => setStep(s.key as UploadStep)}
                                className={cn(
                                    'flex flex-col items-center gap-1 flex-1',
                                    i <= stepIndex ? 'opacity-100' : 'opacity-30'
                                )}
                            >
                                <div className={cn(
                                    'w-9 h-9 rounded-xl flex items-center justify-center',
                                    i < stepIndex ? 'bg-green-600 text-white' :
                                        i === stepIndex ? 'bg-gray-950 text-white' :
                                            'bg-gray-100 text-gray-400'
                                )}>
                                    {i < stepIndex ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">{s.label}</span>
                            </button>
                            {i < steps.length - 1 && (
                                <div className={cn('flex-1 h-[2px] mb-4', i < stepIndex ? 'bg-green-500' : 'bg-gray-100')} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Info Banner */}
            <div className="px-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                        All documents are securely stored and only used for identity verification by system administrators. Your data is protected.
                    </p>
                </div>
            </div>

            {/* Step Content */}
            <div className="px-4 space-y-6">

                {step === 'id_document' && (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-black text-green-950 uppercase tracking-tight mb-1">National ID & Selfie</h2>
                            <p className="text-xs font-bold text-text-muted">Upload clear photos of both sides of your National ID and a face selfie.</p>
                        </div>
                        <div className="space-y-6">
                            <UploadBox
                                field="id_front_url"
                                label="Upload ID Front Side"
                                hint="Clear photo of the front of your National ID. JPG, PNG up to 5MB."
                            />

                            <UploadBox
                                field="id_back_url"
                                label="Upload ID Back Side"
                                hint="Clear photo of the back of your National ID. JPG, PNG up to 5MB."
                            />

                            <UploadBox
                                field="face_verification_url"
                                label="Upload Face Selfie"
                                hint="A clear close-up photo of your face for identity verification. JPG, PNG up to 5MB."
                            />
                        </div>
                        <button
                            onClick={() => setStep('license_image')}
                            disabled={!form.id_front_url || !form.id_back_url || !form.face_verification_url}
                            className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all"
                        >
                            Continue →
                        </button>
                    </div>
                )}

                {step === 'license_image' && (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-black text-green-950 uppercase tracking-tight mb-1">Driving Licence (Optional)</h2>
                            <p className="text-xs font-bold text-text-muted">Upload a clear photo of your valid driving licence if you have one. If you don't have one (e.g. you ride a bicycle, deliver on foot, or don't have a licence), you can skip this step.</p>
                        </div>
                        <UploadBox
                            field="license_image_url"
                            label="Tap to upload Driving Licence"
                            hint="Clear photo of your licence. JPG, PNG up to 5MB."
                        />
                        <button
                            onClick={() => setStep('vehicle_details')}
                            className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                            {form.license_image_url ? 'Continue →' : 'Skip / I don\'t have a Licence →'}
                        </button>
                    </div>
                )}

                {step === 'vehicle_details' && (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-black text-green-950 uppercase tracking-tight mb-1">Vehicle Details</h2>
                            <p className="text-xs font-bold text-text-muted">Tell us about your delivery vehicle or ride</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Vehicle / Ride Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'motorcycle', label: '🏍️ Boda Boda' },
                                        { key: 'bicycle', label: '🚲 Bicycle' },
                                        { key: 'handcart', label: '🛒 Handcart' },
                                        { key: 'foot', label: '🚶 Foot / Walking' },
                                        { key: 'other', label: '✨ Other / Custom' }
                                    ].map(vt => (
                                        <button
                                            key={vt.key}
                                            type="button"
                                            onClick={() => {
                                                if (vt.key === 'other') {
                                                    setForm(f => ({ ...f, vehicle_type: '', custom_vehicle_type: '' }));
                                                } else {
                                                    setForm(f => ({ ...f, vehicle_type: vt.key, custom_vehicle_type: '' }));
                                                }
                                            }}
                                            className={cn(
                                                'h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95',
                                                (form.vehicle_type === vt.key || (vt.key === 'other' && !['motorcycle', 'bicycle', 'handcart', 'foot'].includes(form.vehicle_type)))
                                                    ? 'bg-gray-950 text-white border-gray-950'
                                                    : 'bg-gray-50 text-text-muted border-gray-100'
                                            )}
                                        >
                                            {vt.label}
                                        </button>
                                    ))}
                                </div>

                                {(!['motorcycle', 'bicycle', 'handcart', 'foot'].includes(form.vehicle_type) || form.vehicle_type === '') && (
                                    <div className="mt-3">
                                        <label className="block text-[9px] font-black text-brand-600 uppercase tracking-widest mb-1.5">Specify your Ride / Vehicle Type</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Tuk Tuk, Scooter, Wheelbarrow, Electric Bike"
                                            value={form.custom_vehicle_type || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setForm(f => ({ ...f, vehicle_type: val, custom_vehicle_type: val }));
                                            }}
                                            className="w-full h-14 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-green-950 outline-none focus:border-brand-300"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Number Plate (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. KBZ 123A"
                                    value={form.license_plate}
                                    onChange={e => setForm(f => ({ ...f, license_plate: e.target.value.toUpperCase() }))}
                                    className="w-full h-14 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-green-950 uppercase tracking-widest outline-none focus:border-brand-300"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Licence Number (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. A123456789"
                                    value={form.license_number}
                                    onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))}
                                    className="w-full h-14 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-green-950 outline-none focus:border-brand-300"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('review')}
                            className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Review & Submit →
                        </button>
                    </div>
                )}

                {step === 'review' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-4">
                            <h2 className="text-lg font-black text-green-950 uppercase tracking-tight">Review Submission</h2>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">ID Front Side</span>
                                    {form.id_front_url
                                        ? <CheckCircle2 size={16} className="text-green-600" />
                                        : <span className="text-[9px] text-red-500 font-black uppercase">Missing</span>
                                    }
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">ID Back Side</span>
                                    {form.id_back_url
                                        ? <CheckCircle2 size={16} className="text-green-600" />
                                        : <span className="text-[9px] text-red-500 font-black uppercase">Missing</span>
                                    }
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">Face Selfie</span>
                                    {form.face_verification_url
                                        ? <CheckCircle2 size={16} className="text-green-600" />
                                        : <span className="text-[9px] text-red-500 font-black uppercase">Missing</span>
                                    }
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">Driving Licence</span>
                                    {form.license_image_url
                                        ? <CheckCircle2 size={16} className="text-green-600" />
                                        : <span className="text-[9px] text-amber-600 font-black uppercase">Optional / Not Provided</span>
                                    }
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">Vehicle Type</span>
                                    <span className="text-xs font-black text-green-950 uppercase">{form.vehicle_type}</span>
                                </div>
                                {form.license_plate && (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                        <span className="text-xs font-black text-text-muted uppercase tracking-widest">Number Plate</span>
                                        <span className="text-xs font-black text-green-950 uppercase">{form.license_plate}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => submitMutation.mutate()}
                            disabled={!canSubmit || submitMutation.isPending}
                            className="w-full h-16 bg-brand-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all shadow-2xl shadow-brand-600/30 flex items-center justify-center gap-3"
                        >
                            {submitMutation.isPending ? (
                                <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                            ) : (
                                <><ShieldCheck size={20} /> Submit for Review</>
                            )}
                        </button>

                        {!canSubmit && (
                            <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest">
                                Upload all required documents before submitting
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
