import { useNavigate } from 'react-router-dom'
import { IconCheck } from '@tabler/icons-react'
import React, { useState } from 'react'

//Mock listing data
const mockListing = {
    id: '4',
    title: 'Calculus - Early Transcendentals',
    price: 'R4500',
    condition: 'Good',
    category: 'Textbook',
    courseCode: 'WTW114',
    listedOn: '7 May 2026',
    views: 42,
    description: 'Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP. Includes the original bookmark and a handwritten summary sheet for chapter 5.',
    tags: ['Good', 'WTW114', 'First Year', 'UP'],
    images: [
        'https://placehold.co/540x300/1a3a7a/ffffff?text=Calculus',
        'https://placehold.co/80x70/1a3a7a/ffffff?text=img2',
        'https://placehold.co/80x70/1a3a7a/ffffff?text=img3',
        'https://placehold.co/80x70/1a3a7a/ffffff?text=img4',
    ],
    status: 'live' as const,
    aiScore: 78,
    aiLabel: 'Low Risk',
    reserved: true,
    timeline: [
        { label: 'Draft created',         time: '7 May 2026 · 09:15', done: true  },
        { label: 'Submitted for review',  time: '7 May 2026 · 09:22', done: true  },
        { label: 'AI Scoring Complete',   time: '7 May 2026 · 09:23', done: true  },
        { label: 'Live',                  time: '7 May 2026 · 09:23', done: true  },
    ],
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode}) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-medium text-navy-700 dark:text-white">{value}</span>
        </div>
    )
}