import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";;
import { ReviewList, ReviewModal } from "../../pages/auth/Review";


interface MockReviewFormProps {
    transactionId: string;
    revieweeName: string;
    revieweeLabel: string;
    onSubmitted: () => void;
    onCancel: () => void;
}

interface MockStarRatingProps {
    value: number;
    readOnly?: boolean;
    size?: number;
}
vi.mock('../../components/layout/ReviewForm', () => ({
    __esModule: true,
    default: (props: MockReviewFormProps) => (
        <div data-testid="review-form">
            <span data-testid="rf-transaction-id">{props.transactionId}</span>
            <span data-testid="rf-reviewee-name">{props.revieweeName}</span>
            <span data-testid="rf-reviewee-label">{props.revieweeLabel}</span>
            <button onClick={props.onSubmitted}>mock-submit</button>
            <button onClick={props.onCancel}>mock-cancel</button>
        </div>
    ),
    StarRating: (props: MockStarRatingProps) => (
        <div
            data-testid="star-rating"
            data-value={props.value}
            data-readonly={String(!!props.readOnly)}
            data-size={props.size}
        />
    ),
}));

vi.mock('../../types/reviewStats', () => ({
    reviewerRoleLabel: (type: string) =>
        type === 'buyer_to_seller' ? 'Buyer' : 'Seller',
}));

import type { Review as ReviewData } from "../../types/listing";

const daysAgoISO = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

let nextReviewedId = 1;

const makeReview = (overrides: Partial<ReviewData> = {}): ReviewData => ({
    reviewId: nextReviewedId++,
    transactionId: 'txn-1',
    reviewerId: 'user-1',
    revieweeId: 'user-2',
    reviewType: 'buyer_to_seller',
    createdAt: daysAgoISO(0),
    rating: 4,
    comment: 'This was a very good transaction.',
    ...overrides,
});

describe('ReviewList', () => {
    it('shows empty state when there are no reviews yet', () => {
        render(<ReviewList reviews={[]} />);
        expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
    });

    it('renders one row per review with the label, stars and the given comment', () => {
        const reveiws = [
            makeReview({ reviewType: 'buyer_to_seller', comment: 'This was a very good transaction.' }),
            makeReview({ reviewType: 'seller_to_buyer', comment: 'What the buyer said.' }),

        ];
        render(<ReviewList reviews={reveiws} />);

        expect(screen.getByText('From a buyer')).toBeInTheDocument();
        expect(screen.getByText('From a seller')).toBeInTheDocument();
        expect(screen.getByText('This was a very good transaction.')).toBeInTheDocument();
        expect(screen.getByText('What the buyer said.')).toBeInTheDocument();

        const stars = screen.getAllByTestId('star-rating');
        expect(stars).toHaveLength(2);
        expect(stars[0]).toHaveAttribute('data-value', '4');
        expect(stars[0]).toHaveAttribute('data-readonly', 'true');
        expect(stars[0]).toHaveAttribute('data-size', '14');
    });

    it('does not render the comment paragraphy when not comment was provided', () => {
        const reviews = [makeReview({ comment: null})];
        const { container} = render(<ReviewList reviews={reviews} />)
        expect(container.querySelector('p')).toBeNull();

    })
    it('shows Today if the review was create on that same day', () => {
        render(<ReviewList reviews={[makeReview({ createdAt: daysAgoISO(0)})]} />);
        expect(screen.getByText('Today')).toBeInTheDocument();
    });
    it('shows 1 day ago if the review was made yesterday', () => {
        render(<ReviewList reviews={[makeReview({createdAt: daysAgoISO(1)})]} />);
        expect(screen.getByText('1 day ago')).toBeInTheDocument();
    })
    it('shows N days ago for reviews made n days ago', () => {
        render(<ReviewList reviews={[makeReview({ createdAt: daysAgoISO(5)})]} />);
        expect(screen.getByText('5 days ago')).toBeInTheDocument();
    });
    it('shows singula 1 month ago if the review was made exactly one month ago', () => {
        render(<ReviewList reviews={[makeReview({ createdAt: daysAgoISO(30)})]} />);
        expect(screen.getByText('1 month ago')).toBeInTheDocument();
    })

    it('shows singular N months ago for a review made multiple months ago', () => {
        render(<ReviewList reviews={[makeReview({ createdAt: daysAgoISO(60)})]} />);
        expect(screen.getByText('2 months ago')).toBeInTheDocument();
    });

    it('shows a singular 1 year ago close to a year', () => {
        render(<ReviewList reviews={[makeReview({ createdAt: daysAgoISO(400)})]} />);
        expect(screen.getByText('1 year ago')).toBeInTheDocument();
    })
    it('shows N year ago for a review made N years ago', () => {
        render(<ReviewList reviews={[makeReview({ createdAt: daysAgoISO(800)})]} />);
        expect(screen.getByText('2 years ago')).toBeInTheDocument();
    });
});

describe('ReviewModal', () => {
    const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        transactionId: 'text-123',
        revieweeName: 'Tafadzwa Musiiwa',
        revieweeLabel: 'seller' as const,
        onSubmitted: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when isOpen is false', () => {
        const { container} = render(<ReviewModal {...baseProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the moday with a heading', () => {
        render(<ReviewModal {...baseProps} />);
        expect(screen.getByText('Leave a Review')).toBeInTheDocument();
        expect(screen.getByTestId('rf-transaction-id')).toHaveTextContent('text-123');
        expect(screen.getByTestId('rf-reviewee-name')).toHaveTextContent('Tafadzwa Musiiwa');
        expect(screen.getByTestId('rf-reviewee-label')).toHaveTextContent('seller');
    });

    it('calls onclose when the close button is clicked', () => {
        render(<ReviewModal {...baseProps} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    })

    it('calls onCancel when the from cancel button is used', () => {
        render(<ReviewModal {...baseProps} />);
        fireEvent.click(screen.getByText('mock-cancel'));
        expect(baseProps.onClose).toHaveBeenCalledTimes(1);
        expect(baseProps.onSubmitted).not.toHaveBeenCalled();
    });

    it('calls onSubmitted when the form is submitted succsefully', () => {
        render(<ReviewModal {...baseProps} />);
        fireEvent.click(screen.getByText('mock-submit'));
        expect(baseProps.onSubmitted).toHaveBeenCalledTimes(1);
        expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    });
});