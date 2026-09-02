import React, { useRef, useState } from 'react';
import { IconChevronDown, IconChevronUp, IconCloudUpload, IconInfoCircle, IconCircleCheck } from '@tabler/icons-react';
import { getApiUrl } from '../../config';
import { useNavigate } from 'react-router';
//import { useToast } from '../../components/layout/useToast';

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

function UploadSuccessModal({ onProceed }: { onProceed: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <IconCircleCheck size={28} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Proof of Registration Submitted</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Your document has been received and is now under review. We will email you once a decision
                    has been made. You can still browse and use limited features in the meantime.
                </p>
                <button
                    type="button"
                    onClick={onProceed}
                    className="w-full py-3 bg-navy-700 text-white font-bold rounded-xl hover:bg-navy-600 transition-colors"
                >
                    Proceed to Login
                </button>
            </div>
        </div>
    );
}

export default function ProofOfRegistrationUpload() {
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();
    //const { showToast } = useToast();

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

    const submitFile = async (file: File) => {
        const validationError = validateFile(file);

        if (validationError) {
            setUploadedFile({ name: file.name, status: 'error', errorMessage: validationError });
            return;
        }

        setUploadedFile({ name: file.name, status: 'uploading' });

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${getApiUrl()}/auth/upload-por`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (res.ok) {
                setUploadedFile({ name: file.name, status: 'success' })
                setShowSuccessModal(true);

            } else {
                const body = await res.json().catch(() => null);
                setUploadedFile({
                    name: file.name, status: 'error',
                    errorMessage: resolveErrorMessage(body?.error),
                });
            }
        } catch {
            setUploadedFile({
                name: file.name, status: 'error',
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
                <div className="w-full max-w-[900px] mb-8 rounded-xl bg-blue-50 dark:bg-navy-700/60 border border-blue-100 dark:border-navy-600 overflow-hidden transition-all duration-200">
                    <button
                        type="button"
                        onClick={() => setIsInfoOpen(!isInfoOpen)}
                        className="w-full p-4 flex items-center justify-between text-left focus:outline-none hover:bg-blue-100/50 dark:hover:bg-navy-600/50 transition-colors"
                        aria-expanded={isInfoOpen}
                    >
                        <div className="flex items-start gap-3">
                            <IconInfoCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 shrick-0 mt-0.5" size={25} />
                            <span className="font-semibold text-gray-900 dark:text-white text-base">
                                Why do we need this?
                            </span>
                        </div>
                        <div className="text-gray-500 dark:text-navy-100 p-1">
                            {isInfoOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                        </div>
                    </button>
                    {isInfoOpen && (
                        <div className="px-4 pb-4 pt-1 text-sm text-gray-700 dark:text-navy-100 leading-relaxed border-t border-blue-100/60 dark:border-navy-600/60">
                            We require your official proof of registration to confirm the currrent degree you are studying, this
                            is needed for the system to be able to recommend listings based on your degree. If you don't upload your proof of registration
                            you will not have access to the system as this is needed as part of the verification process. Once you upload your proof of registration
                            your account will be under-review and you will be allowed partial access to the system.
                        </div>
                    )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-16 text-center tracking-tight">
                    Proof Of Registration Upload
                </h1>
                <div
                    className="w-full max-w-[900px] border-2 border-dashed border-gray-300 dark:border-navy-600 rounded-[24px] py-20 flex flex-col items-center justify-center mb-10 transition-colors hover:border-navy-500 dark:hover:border-secondary-500 cursor-pointer"
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
                {showSuccessModal && (
                    <UploadSuccessModal onProceed={() => navigate('/auth/Login')} />
                )}

            </div>
        </div >
    );
}

