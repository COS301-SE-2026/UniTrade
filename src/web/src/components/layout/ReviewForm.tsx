import { useState } from "react";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { listingsService } from "../../services/listingsService";


interface StarRatingProps {
    value: number
    onChange? : (value: number) => void
    size?: number
    readonly?: boolean
}


export default function StarRating({value, onChange, size = 28, readOnly = false} : StarRatingProps) {
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
                    disabled = {readOnly}
                    onClick = {() => onChange?.(star)}
                    className = {`transition-transform ${readOnly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
                    aria-label = {`${star} star${star > 1 ? 's' : ''}`}
                    aria-checked = {filled}
                >
                    {filled ? (
                        <IconStarFilled size = {size} className = "text-amber-400" />
                    ) : (
                        <IconStar size = {size} className="text-gray-300" />
                    )}
                </button>                )
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
}: ReviewFormProps) {
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
            </div>
        </div>
    )
}
