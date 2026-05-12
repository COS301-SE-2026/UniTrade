import { useNavigate } from 'react-router-dom'
import {
  IconBookmark,
  IconHeart,
  IconMessage,
  IconFlag,
  IconStar,
  IconCheck,
  IconChevronRight,
} from '@tabler/icons-react'
import type React from 'react';

function DetailRow ({ label, value}: { label: string; value: React.ReactNode}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-navy-700 dark:text-white">{value}</span>
    </div>
  )
}