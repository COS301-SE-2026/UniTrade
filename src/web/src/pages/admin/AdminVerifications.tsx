import {useState} from 'react'
import { IconSearch, IconFileText,IconEye } from "@tabler/icons-react"

export interface VerificationRequest{
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

const MockVerifications: VerificationRequest[] = [
  {
    id: '1',
    name: 'Tafadzwa Musiiwa',
    initials: 'TM',
    degree: 'BSc Comp Sci, Y2',
    submittedDate: '14 May 2026',
    email: 'tmusiiwa@tuks.co.za',
    slaStatus: '2.5 days ago',
    slaState: 'Overdue',
    slaProgress: 85 ,
    slaMessage: "Past SLA - action required",
    domain: 'Valid SLA Domain',
    docName: "Proof_Of_Registration.pdf",
    docSize:'1.2MB',
    docDate: '8 May 2026',
  },
    {
    id: '2',
    name: 'Mahadio Tlaka',
    initials: 'MT',
    degree: 'BSc Comp Sci, Y2',
    submittedDate: '14 May 2026',
    email: 'mtlaka@tuks.co.za',
    slaStatus: '3 days ago',
    slaState: 'Overdue',
    slaProgress: 100 ,
    slaMessage: "Past SLA - action required",
    domain: 'Valid SLA Domain',
    docName: "Proof_Of_Registration.pdf",
    docSize:'1.2MB',
    docDate: '8 May 2026',
  },
    {
    id: '3',
    name: 'Zelamene Shazi',
    initials: 'ZS',
    degree: 'BSc Comp Sci, Y2',
    submittedDate: '14 May 2026',
    email: 'zshazi@tuks.co.za',
    slaStatus: '12 hrs left',
    slaState: 'Overdue',
    slaProgress: 85 ,
    slaMessage: "Past SLA - action required",
    domain: 'Valid SLA Domain',
    docName: "Proof_Of_Registration.pdf",
    docSize:'1.2MB',
    docDate: '8 May 2026',
  },
  {
    id: '4',
    name: 'Sabira Karie',
    initials: 'SK',
    degree: 'BSc Comp Sci, Y2',
    submittedDate: '14 May 2026',
    email: 'skarie@tuks.co.za',
    slaStatus: '2 days left',
    slaState: 'Normal',
    slaProgress: 25,
    slaMessage: "Past SLA - action required",
    domain: 'Valid SLA Domain',
    docName: "Proof_Of_Registration.pdf",
    docSize:'1.2MB',
    docDate: '8 May 2026',
  }]

export default function AdminVerifications() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Verifications</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}