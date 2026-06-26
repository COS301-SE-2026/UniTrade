import React, { useState } from 'react';
import {
  IconShield,
  IconUsers,
  IconMapPin,
  IconLock,
  IconRobot,
  IconPackage,
  IconStar,
  IconArrowRight,
  IconCheck,
} from '@tabler/icons-react'

interface StatProps {
  number: string;
  label: string;
}

function Stat ({ number, label}: StatProps) {
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-white">{number}</p>
      <p className="text-sm text-blue-200 mt-1">{label}</p>
    </div>
  );
}

interface ProblemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ProblemCard({ icon, title, description }: ProblemCardProps){
  return (
    <div className="bg-white/90 dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
      <div className="w-12 h-12 bg-blue-100 dark:bg-navy-700 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-navy-700 dark:text-white text-lg mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

interface SolutionCardProps {
  icon: React.ReactNode;
  title: string,
  description: string;
}

function SolutionCard({ icon, title, description }: SolutionCardProps) {
  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-all duration-200 group">
      <div className="w-11 h-11 bg-navy-700 text-white rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-navy-700 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}