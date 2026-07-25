import {Loader2} from 'lucide-react'

export function Spinner({
    size = 20,
    className = ''
}: {
    size?: number
    className?: string
}) {
    return <Loader2 size={size} className = {`animate-spin text-navy-700 ${className}` } />

}


export function LoadingState({
    message = 'Loading...',
} : {
    message?: string
}) {
    return (
        <div className = "flex flex-col items-center justify-center py-16 text-gray-500">
            <Spinner size = {28} className = "mb-2" />
            <p className = "text-sm">
                {message}
            </p>
        </div>
    )
}