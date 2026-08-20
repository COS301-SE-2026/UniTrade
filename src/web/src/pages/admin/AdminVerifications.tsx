import {useState} from 'react'
import { IconSearch, IconFileText,IconEye } from "@tabler/icons-react"

export interface VerificartionRequest{
  id: string
  name: string
  initials: string
  degree: string
  submittedDate: string
  email: string
  slaStatus: string
  slaState: 'Overdue' | 'Due soon' | 'Normal'
  slaProgress: number
  slaMessage: string
  domain: string
  docName: string
  docSize: string
  docDate:string

}


export default function AdminVerifications() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Verifications</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}