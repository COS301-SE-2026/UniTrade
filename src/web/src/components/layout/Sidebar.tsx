import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  IconLayoutDashboard,
  IconSwitchHorizontal,
  IconShoppingBag,
  IconHeart,
  IconBookmark,
  IconMessage,
  IconUser,
  IconSettings,
  IconShieldCheck,
  IconListCheck,
  IconFlag,
  IconUsers,
  IconChartBar,
  IconPlus,
  IconPackage,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import { useAuthStore } from '../../store/useAuthStore'
import React, { useState } from 'react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  badge?: number
}

interface NavSection {
  heading: string
  items: NavItem[]
}

const buyerNav: NavSection[] = [{
  heading: 'Main',
  items: [
    {
      label: 'Dashboard', to: '/dashboard', icon: <IconLayoutDashboard size={18} />},
    { label: 'Switch', to:'/switch', icon: <IconSwitchHorizontal size={18} />},
    { label: 'My Orders', to:'/orders', icon: <IconShoppingBag size={18} />, badge:3},
    { label: 'My Wishlist', to: '/wishlist', icon: <IconHeart size={18} />},
    {label: 'Reserved', to: '/reserved', icon: <IconBookmark size={18} />, badge:2},

  ],
},
{
  heading: 'Account',
  items: [
    { label: 'Messages', to: '/messages', icon: <IconMessage size={18} />, badge: 5},
    { label: 'Profile', to: '/profile', icon: <IconUser size={18} />},
    { label: 'Settings', to: '/settings', icon: <IconSettings size={18} />},
  ],
},
]