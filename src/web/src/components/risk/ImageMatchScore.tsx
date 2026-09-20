import {IconPhoto} from '@tabler/icons-react';

const LOW_MATCH_THRESHOLD = 0.5;

export function isLowImageMatch(score: number | null):boolean {
    return score!== null && score <LOW_MATCH_THRESHOLD;
}

export default function ImageMatchScore({ score}: Readonly<{score: number | null }>)
{
    if( score === null) {
        return <span className="text-gray-500 text-[10px]">Image chech not run</span>;

    }

    const low = isLowImageMatch(score);

return (
    <span 
    className={ `inline-flex items-center gap-1 text-xs font-semibold ${low ? 'text-rose-700' : 'text-emerald-700' }`}
    >

        <IconPhoto className="w-3.5 h-3.5" />
        Image match {Math.round(score *100)}%
        </span>

);
}
