import { IconX, IconStar } from '@tabler/icons-react'
import ReviewForm, { StarRating } from '../../components/layout/ReviewForm'
import type { Review as ReviewData, ReviewType } from '../../types/listing'
import { reviewerRoleLabel } from '../../types/reviewStats'

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
}

export function ReviewList({ reviews }: Readonly<{ reviews: ReviewData[] }>) {
  if (reviews.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-gray-400">No reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-50">
      {reviews.map((review) => (
        <div key={review.reviewId} className="px-4 py-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-block bg-navy-700/10 text-navy-700 text-[11px] font-semibold px-2 py-0.5 rounded">
              From a {reviewerRoleLabel(review.reviewType as ReviewType).toLowerCase()}
            </span>
            <span className="text-[11px] text-gray-400">{timeAgo(review.createdAt)}</span>
          </div>
          <div role="img" aria-label={`Rated ${review.rating} out of 5 stars`}>
            <StarRating value={review.rating} readOnly size={14} />
          </div>
          {review.comment && <p className="text-sm text-gray-600 mt-1.5">{review.comment}</p>}
        </div>
      ))}
    </div>
  )

}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  revieweeName: string
  revieweeLabel: 'buyer' | 'seller'
  onSubmitted: () => void
}

export function ReviewModal({
  isOpen,
  onClose,
  transactionId,
  revieweeName,
  revieweeLabel,
  onSubmitted,
}: Readonly<ReviewModalProps>) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 text-navy-700">
            <IconStar size={20} />
            <h3 className="font-bold text-navy-900">
              Leave a Review
            </h3>
          </div>
          <button
            type='button'
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        <ReviewForm
          transactionId={transactionId}
          revieweeName={revieweeName}
          revieweeLabel={revieweeLabel}
          onSubmitted={() => {
            onSubmitted()
            onClose()
          }}
          onCancel={onClose}
        />
      </div>
    </div>


  )
}

