import { useState } from "react";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { listingsService } from "../../services/listingsService";


interface StarRatingProps {
    value: number
    onChange? : (value: number) => void
    size?: number
    readOnly?: boolean
}


export function StarRating({
    value, 
    onChange, 
    size = 28, 
    readOnly = false,
} : Readonly<StarRatingProps>) {
    const stars = [1, 2, 3, 4, 5]

    return (
        <div className = "flex items-center gap-1"
        role = {readOnly ? undefined : 'radiogroup'} aria-label = "Rating">
            {stars.map((star) => {
                const filled = star <= value
                return (
                    <button 
                    key = {star}
                    type = "button"
                    role={readOnly? undefined : 'radio'}
                    disabled = {readOnly}
                    onClick = {() => onChange?.(star)}
                    className = {`transition-transform ${readOnly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
                    aria-label = {`${star} star${star > 1 ? 's' : ''}`}
                    aria-checked = {readOnly? undefined : filled}
                >
                    {filled ? (
                        <IconStarFilled size = {size} className = "text-amber-400" />
                    ) : (
                        <IconStar size = {size} className="text-gray-300" />
                    )}
                </button>                
                )
            })}
        </div>
    )
}


const REVIEW_ERROR_MESSAGES: Record<string, string> = {
    TransactionNotFound: "we could not find that transaction",
    TransactionNotComplete: "This transaction needs to be marked as complete before you can add a review",
    AlreadyReviewed: "You have already reviewed this transaction",
    NotAParty: "You were not part of this transaction",
    SelfReview: "You can not review yourself",
    InvalidRating: "Please select a rating between 1 and 5",
}

interface ReviewFormProps {
    transactionId: string
    revieweeName: string
    revieweeLabel: 'buyer' | 'seller'
    onSubmitted: () => void
    onCancel: () => void
}


export default function ReviewFrom({
    transactionId,
    revieweeName,
    revieweeLabel,
    onSubmitted,
    onCancel,
}: Readonly<ReviewFormProps>) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)


    const handleSubmit = async () => {
        if(rating === 0){
            setError('Please select a rating before submitting')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await listingsService.submitReview({
                transactionId,
                rating,
                comment: comment.trim() || undefined,
            })
            onSubmitted()
        } catch(err) {
            const message = err instanceof Error ? err.message : null
            setError((message && REVIEW_ERROR_MESSAGES[message]) ?? message ?? 'Failed to submit review, please try again ')
        } finally{
            setSubmitting(false)
        }
    }

    return (
        <div className = "flex flex-col gap-4">
            <div>
                <p className = "text-sm text-gray-500">
                    Reviewing {revieweeLabel}
                </p>
                <p className = "text-base font-bold text-navy-900">
                    {revieweeName}
                </p>
            </div>

            <div>
                <p className = "text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Your rating
                </p>
                <StarRating value = {rating} onChange = {setRating} />
            </div>

            <div>
                <label
                htmlFor = "review-comment"
                className = "text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block"
                >
                    Comments (optional)
                </label>
                <textarea
                id = "review-comment"
                value = {comment}
                onChange = {(e) => setComment(e.target.value)}
                rows = {4}
                maxLength={500}
                placeholder = "Share details about your experience..."
                className = "w-full rounded-xl border border-gray-200 px-3 py-2 text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-700/20 resize-none"
                />
                <p className = "text-[11px] text-gray-400 mt-1 text-right">
                    {comment.length}/500
                </p>
            </div>

            {error && 
            <p className = "text-sm text-red-500">
                {error}
            </p>}

            <div className = "flex gap-3 mt-2">
                <button
                type = "button"
                onClick = {onCancel}
                disabled = {submitting}
                className = "flex-1 rounded-full border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel 

                </button>
                <button 
                type = "button"
                onClick = {handleSubmit}
                disabled = {submitting}
                className = "flex-1 rounded-full bg-navy-700 text-white font-semibold text-sm py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>

                </div>
        </div>
    )
}
