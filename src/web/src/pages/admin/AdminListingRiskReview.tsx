import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconChevronRight, IconX } from '@tabler/icons-react';
import { InfoRow, Panel, DecisionButton } from './AdminReviewShared';
import { getFlaggedListing, decideListing } from '../../services/adminService';
import type { ApiError } from '../../types/admin_disputes';
import { queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../components/layout/useToast';
import { LoadingState } from '../../components/layout/Spinner';
import RiskBadge from '../../components/risk/RiskBadge';
import RiskReasons from '../../components/risk/RiskReasons';
import ImageMatchScore from '../../components/risk/ImageMatchScore';
import { imageUrl } from '../../services/listingsService';

//const LOW_MATCH_THRESHOLD = 0.5;

const zar = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA');
}

function humanise(value: string) {
    const spaced = value.replace(/_/g, ' ').trim();
    return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : 'Unknown';
}

function RemoveReasonModal({
    title,
    onCancel,
    onSubmit,
    submitting,
}: {
    title: string;
    onCancel: () => void;
    onSubmit: (reason: string) => void;
    submitting: boolean;
}) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onCancel();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <button
                type="button"
                aria-label="Close dialog"
                tabIndex={-1}
                className="absolute inset-0 w-full h-full cursor-default"
                onClick={onCancel}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-listing-title"
                className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 id="remove-listing-title" className="text-2xl font-bold text-gray-900">
                        Reason
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-600 hover:text-gray-800"
                        aria-label="Close"
                    >
                        <IconX size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Your Decision: <span className="font-semibold text-gray-900">Remove "{title}"</span>
                </p>

                <label className="block text-sm text-gray-700 mb-2" htmlFor="remove-reason">
                    Reason
                </label>
                <textarea
                    id="remove-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-navy-700 resize-none"
                    placeholder="Explain why this listing is being removed. The seller will see this."
                />

                <button
                    type="button"
                    onClick={() => onSubmit(reason.trim())}
                    disabled={!reason.trim() || submitting}
                    className="w-full mt-4 py-3 bg-navy-700 text-white font-bold rounded-xl hover:bg-navy-600 transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Done'}
                </button>
            </div>
        </div>
    );
}

export default function AdminListingRiskReview() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [selectedImage, setSelectedImage] = useState(0);
    const [showRemoveModal, setShowRemoveModal] = useState(false);

    const {
        data: listing,
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: queryKeys.flaggedListing(id),
        queryFn: () => getFlaggedListing(id),
        enabled: Boolean(id),
        retry: false,
    });

    const decision = useMutation({
        mutationFn: (vars: { action: 'approve' | 'remove'; reason?: string }) => decideListing(id, vars),
        onSuccess: (_data, vars) => {
            showToast(
                'success',
                vars.action === 'approve' ? 'Listing approved and now live' : 'Listing removed'
            );
            queryClient.invalidateQueries({ queryKey: queryKeys.flaggedListings() });
            queryClient.removeQueries({ queryKey: queryKeys.flaggedListing(id) });
            navigate("/admin/listings");
        },
        onError: (err) => {
            const apiError = err as unknown as ApiError;
            showToast('error', apiError.message || 'Failed to submit decision');
            setShowRemoveModal(false);
        },
    });

    if (loading) {
        return <LoadingState message="Loading listing..." />;
    }

    if (error || !listing) {
        return (
            <p className="text-sm text-gray-600">
                Flagged listing not found.
            </p>
        );
    }

    const images = (listing.images ?? []).map(imageUrl);
    const activeImage = images[Math.min(selectedImage, Math.max(images.length - 1, 0))];
    //const lowMatch =
    //listing.imageMatchScore !== null && listing.imageMatchScore < LOW_MATCH_THRESHOLD;
    const isActionDisabled = decision.isPending;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <button
                    type="button"
                    onClick={() => navigate("/admin/listings")}
                    className="text-[#00aaff] hover:underline cursor-pointer"
                >
                    Flagged Listings
                </button>
                <IconChevronRight size={12} />
                <span className="text-gray-400"></span>
                <span className="text-gray-600">Listing Review</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <Panel title="Listing">
                        {activeImage ? (
                            <div className="space-y-2 mb-4">
                                <img
                                    src={activeImage}
                                    alt={`${listing.title}, photo ${selectedImage + 1}`}
                                    className="w-full max-h-80 object-contain rounded-lg bg-gray-50"
                                />
                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {images.map((src, i) => (
                                            <button
                                                key={src}
                                                type="button"
                                                onClick={() => setSelectedImage(i)}
                                                aria-label={`Show photo ${i + 1}`}
                                                className={`shrink-0 rounded-md overflow-hidden border-2 cursor-pointer ${i === selectedImage ? 'border-navy-700' : 'border-transparent'
                                                    }`}
                                            >
                                                <img src={src} alt="" className="w-14 h-14 object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="mb-4 text-xs text-gray-600">This listing has no photos.</p>
                        )}
                        <InfoRow label="Title" value={listing.title} />
                        <InfoRow label="Price" value={zar.format(listing.price)} />
                        <InfoRow label="Category" value={listing.categoryName} />
                        <InfoRow label="Condition" value={humanise(listing.condition)} />
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-600 mb-1">Description</p>
                            <p className="text-sm text-navy-700 dark:text-white whitespace-pre-line">
                                {listing.description?.trim() || 'No description provided.'}
                            </p>
                        </div>
                    </Panel>
                    <Panel title="Risk assessment">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <RiskBadge level={listing.riskLevel} />
                            <span className="text-xs text-gray-600">Score {listing.riskScore}/100</span>
                            <span className="text-xs text-gray-600">Visibility {listing.visibilityScore}</span>
                            <ImageMatchScore score={listing.imageMatchScore} />
                        </div>
                        <RiskReasons reasons={listing.reasons} images={images} />
                    </Panel>
                    <Panel title="Actions">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <DecisionButton
                                tone="success"
                                disabled={isActionDisabled}
                                onClick={() => decision.mutate({ action: 'approve' })}
                            >
                                {decision.isPending && decision.variables?.action === 'approve'
                                    ? 'Approving...'
                                    : 'Approve'}
                            </DecisionButton>
                            <DecisionButton
                                tone="danger"
                                disabled={isActionDisabled}
                                onClick={() => setShowRemoveModal(true)}
                            >
                                {decision.isPending && decision.variables?.action === 'remove'
                                    ? 'Removing...'
                                    : 'Remove'}
                            </DecisionButton>
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            Approving makes the listing live and restores its visibility. Removing needs a reason,
                            which the seller will see.
                        </p>
                        {listing.copyCount > 1 && (
                            <p className="text-xs text-amber-700 mt-2">
                                This listing has {listing.copyCount} copies. Your decision applies to all of them.
                            </p>
                        )}
                    </Panel>
                </div>
                <div className="space-y-4">
                    <Panel title="Seller">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#0a1931] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {listing.seller.initials}
                            </div>
                            <p className="text-sm font-semibold text-navy-700 dark:text-white">
                                {listing.seller.name}
                            </p>
                        </div>
                        <InfoRow label="Verification" value={humanise(listing.seller.verificationStatus)} />
                        <InfoRow
                            label="Strikes"
                            value={
                                <span className={listing.seller.strikeCount > 0 ? 'text-red-600' : undefined}>
                                    {listing.seller.strikeCount}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Prior flags"
                            value={
                                <span className={listing.seller.priorFlagCount > 0 ? 'text-red-600' : undefined}>
                                    {listing.seller.priorFlagCount}
                                </span>
                            }
                        />
                    </Panel>
                    <Panel title="Case Info">
                        <InfoRow label="Listing ID" value={`#${listing.listingId}`} />
                        <InfoRow label="Flagged" value={formatDate(listing.createdAt)} />
                    </Panel>
                </div>
            </div>
            {showRemoveModal && (
                <RemoveReasonModal
                    title={listing.title}
                    submitting={decision.isPending}
                    onCancel={() => setShowRemoveModal(false)}
                    onSubmit={(reason) => decision.mutate({ action: 'remove', reason })}
                />
            )}
        </div>
    );
}