import React, { useRef, useState } from 'react';
import { IconCloudUpload } from '@tabler/icons-react';
import { getApiUrl } from '../../config';
import { useNavigate } from 'react-router';
import { useToast } from '../../components/layout/useToast';

type UploadStatus = 'uploading' | 'success' | 'error';

interface UploadedFile {
    name: string;
    status: UploadStatus;
    errorMessage?: string;
}

const Allowed_Types = ['application/pdf', 'image/jpeg', 'image/png'];
const Max_size_bytes = 5 * 1024 * 1024;

const error_messages: Record<string, string> = {
    no_file: 'Please choose a file to upload.',
    file_too_large: 'File must be smaller than 5MB.',
    invalid_file_type: 'Only PDF, JPG, or PNG files are allowed.',
    unauthenticated: 'Your session has expired. Please log in again.',
    no_pending_verfication: 'There\u2019s no verification request awaiting a document. Please verfiy your OTP first.',
    invalid_verification_state: 'Your verification isn\u2019t at a stage that accepts a document right now.',
    server_error: 'Something went wrong on our end. Please try again shortly.',
};

const Default_error_message = 'Upload failed. Please try again.';

function resolveErrorMessage(code: string | undefined): string {
    if (!code) return Default_error_message;
    return error_messages[code] ?? Default_error_message;
}


export default function ProofOfRegistrationUpload() {
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { showToast} = useToast();

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
           submitFile(e.target.files[0]);
        }

        e.target.value = '';
    };

    const validateFile = (file: File): string | null => {
        if (!Allowed_Types.includes(file.type)) {
            return error_messages.invalid_file_type;
        }
        if (file.size > Max_size_bytes) {
            return error_messages.file_too_large;
        }

        return null;
    };

    const submitFile = async(file: File) => {
        const validationError = validateFile(file);

        if (validationError) {
            setUploadedFile({ name: file.name, status: 'error', errorMessage: validationError});
            return;
        }

        setUploadedFile({ name: file.name, status: 'uploading'});

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${getApiUrl()}/auth/upload-por`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (res.ok) {
                setUploadedFile({ name: file.name, status: 'success'})
                showToast('success', 'Proof of registration submitted. We\u2019ll email you once it\u2019s been reviewed.');
                setTimeout(() => navigate('/auth/Login'), 1200);

            } else {
                const body = await res.json().catch(() => null);
                setUploadedFile({ name: file.name, status: 'error',
                    errorMessage: resolveErrorMessage(body?.error),
                });
            }
        } catch {
            setUploadedFile({name: file.name, status: 'error',
                errorMessage: 'Network error. Please check your connection and try again.',
            });
        }
    };

    const statusStyles: Record<UploadStatus, string> = {
        uploading: 'bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-navy-200',
        success: 'bg-emerald-100 text-success-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-navy-900 p-6 md:p-12 flex items-center justify-center font-sans">

            <div className="w-full max-w-[1024px] bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-10 md:p-20 flex flex-col items-center shadow-sm">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-16 text-center tracking-tight">
                    Proof Of Registration Upload
                </h1>
                <div
                    className="w-full max-w-[700px] border-2 border-dashed border-gray-300 dark:border-navy-600 rounded-[24px] py-16 flex flex-col items-center justify-center mb-10 transition-colors hover:border-navy-500 dark:hover:border-secondary-500 cursor-pointer"
                    onClick={handleFileClick}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            submitFile(e.dataTransfer.files[0]);
                        }
                    }}
                >
                    <IconCloudUpload
                        size={72}
                        stroke={1}
                        className="text-gray-700 dark:text-navy-100 mb-6"
                    />
                    <p className="text-[17px] font-bold text-gray-800 dark:text-white mb-2">
                        Drag or Drop file(s) here
                    </p>
                    <p className="text-[15px] text-gray-500 dark:text-navy-100 mb-6">
                        or
                    </p>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFileClick();
                        }}
                        className="bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm px-8 py-2.5 rounded-lg transition-colors shadow-md"
                    >
                        Browse File(s)
                    </button>
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                </div>
                {uploadedFile && (
                    <div className="w-full max-w-[700px] border border-secondary-500 bg-white dark:bg-navy-900 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm">
                        <div className="flex flex-col mr-4 min-w-0">
                        <span className="text-[17px] text-gray-800 dark:text-white font-medium tracking-wide truncate mr-4">
                            {uploadedFile.name}
                        </span>
                        {uploadedFile.status === 'error' && uploadedFile.errorMessage && (
                        <span className="text-sm text-red-500 mt-1">
                            {uploadedFile.errorMessage}
                        </span>
                        )}
                    </div>
                    <span 
                    className={`px-5 py-1.5 rounded-full text-xs font-semibold lowercase tracking-wide flex-shrink-0 ${statusStyles[uploadedFile.status]}`}
                    >
                        {uploadedFile.status}
                    </span>
                    </div>
                )}

            </div>
        </div>
    );
}