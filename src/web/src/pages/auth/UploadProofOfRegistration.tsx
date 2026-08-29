import React, { useRef, useState } from 'react';
import { IconCloudUpload } from '@tabler/icons-react';

export default function ProofOfRegistrationUpload() {
    const [uploadedFile, setUploadedFile] = useState<{ name: string; status: string } | null>({
        name: 'Proof_Of_Registration.pdf',
        status: 'success'
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploadedFile({
                name: e.target.files[0].name,
                status: 'success'
            });
        }
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
                            setUploadedFile({
                                name: e.dataTransfer.files[0].name,
                                status: 'success'
                            });
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
                        <span className="text-[17px] text-gray-800 dark:text-white font-medium tracking-wide truncate mr-4">
                            {uploadedFile.name}
                        </span>
                        <span className="bg-emerald-100 text-success-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-5 py-1.5 rounded-full text-xs font-semibold lowercase tracking-wide flex-shrink-0">
                            {uploadedFile.status}
                        </span>
                    </div>
                )}

            </div>
        </div>
    );
}