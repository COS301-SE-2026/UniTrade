import { useState } from 'react';
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