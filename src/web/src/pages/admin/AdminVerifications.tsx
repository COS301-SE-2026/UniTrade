import {useState} from 'react'
import { IconSearch, IconFileText,IconEye, IconTemperature } from "@tabler/icons-react"

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
   const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'All' | 'Overdue' | 'Due soon' | 'Normal'>('All')
  const [sortBy, setSortBy] = useState<'Oldest First' | 'Newest First'>('Oldest First')

  const filteredList= MockVerifications.filter((ver) => {

  const foundMatch = ver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  ver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
   ver.degree.toLowerCase().includes(searchQuery.toLowerCase())

   if(!foundMatch) return false

    if (filter === 'Overdue') return ver.slaState === 'Overdue'
    if (filter === 'Due soon') return ver.slaState === 'Due soon'
    if (filter === 'Normal') return ver.slaState === 'Normal'
    return true
  }) 


const numOverdue =  MockVerifications.filter((ver) => ver.slaState === 'Overdue').length
const numDueSoon = MockVerifications.filter((ver) => ver.slaState === 'Due soon').length
const numPending = MockVerifications.length


  return (
    <div className='p-8 space-y-6 max-w-6xl'>
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder='search...'
          value ={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1931]" />
       <IconSearch className='absolute right-3 top-2.5 h-4 w-4 text-gray-400' />
      </div>
      <div>
       <h1 className="text-2xl font-bold text-gray-900">Student Verifications</h1>
          <p className="text-xs text-gray-500">Review student proof of registration and approve or reject account.</p>
      </div>
      <div className="grid grid-cols gap-4 max-w-4xl">

                <div className="bg-white-p3 rounded-xl border-gray-200 shadow-sm text-center">
          <div className="text-xl font-bold text-gray-900">{numOverdue}</div>
          <div className="text-xs text-gray-500">Overdue</div>
        </div>

        <div className="bg-white-p3 rounded-xl border-gray-200 shadow-sm text-center">
          <div className="text-xl font-bold text-gray-900">{numDueSoon}</div>
          <div className="text-xs text-gray-500">Due Soon</div>
        </div>
     
        <div className="bg-white-p3 rounded-xl border-gray-200 shadow-sm text-center">
          <div className="text-xl font-bold text-gray-900">{numPending}</div>
          <div className="text-xs text-gray-500">Total Pending</div>
    
        </div>

                <div className="bg-white-p3 rounded-xl border-gray-200 shadow-sm text-center">
          <div className="text-xl font-bold text-gray-900">12</div>
          <div className="text-xs text-gray-500">Approved Today</div>
      </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex-items-center space-x-3">
          <button
          type="button"
          onClick={() => setFilter('All')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${
              filter === 'All'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              All({MockVerifications.length})
            </button>

                    <button
          type="button"
          onClick={() => setFilter('Overdue')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${
              filter === 'Overdue'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              Overdue({numOverdue})
            </button>

                      <button
          type="button"
          onClick={() => setFilter('Due soon')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${
              filter === 'Due soon'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              All({numDueSoon})
            </button>
            </div>

      <div>
  <select
  value={sortBy}
  onChange={(e)=> setSortBy(e.target.value as 'Oldest First' | 'Newest First')}
  className='px-4 py-1.5 bg-wjite border border-gray-300 rounded-full-text-xs font-medium text-gray-600 focus:outline-none cursor-pointer'>
    <option value="Oldest First"> Sort: Oldest First</option>
        <option value="Newest First"> Sort: Newest First</option>
  </select>
      </div>
      </div>
    
    <div className="grid grid-cols-2 gap-6">
      {filteredList.map((ver) => (
        <div
        key={ver.id}
        className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5
        spacce-y-4 relative border-l-4 ${
        ver.slaState === 'Overdue'
        ? 'border-l-red-800'
        :ver.slaState === 'Due soon'
        ? 'border-l-amber-600'
        : 'border-l-transparent'
        }`}>

{ver.slaState !== 'Normal' && (
  <span
  className={`absolute top-5 right-5 px-3 py-0.5 rounded-full text-[10px] font-semibold
    
    ${
      ver.slaState === "Overdue"
      ? 'bg-red-200 text-amber-700'
      : 'bg-amber-100 text-amber-700'
    }`}
    >
      {ver.slaState}
    </span>
)}

<div className="flex items-start space-x-3">
  <div className="w-10 h-10 rounded-full bg-[#0a1931] text-whiite
  flex items-center justify font-bold text-sm shrink-0">
    {ver.initials}
    </div>
    <div>
      <h3 className="font-bold text-xs text-gray-900">
        {ver.name}
      </h3>
      <p className='text=[10px] text-gray-400 mt-0.5'>
        {ver.degree}</p>
        </div>
        </div>




<div className='border border-sky-200 bg-sky-50/30 rounded-xl p-3 flex items-center justify-between'>
<div className="flex items-center space-x-2">
  <div className='p-2 bg-sly-100 roundded-lg text-sky-600'>
    <IconFileText className ="w-4 h-4" />
    </div>
  <div>
    <div className='font-semibold text-xs text-gray-800'>
      {ver.docName}</div>
   <div className="text-[10px] text-gray-400">
      Uploaded {ver.docDate} &bull; {ver.docSize}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center space-x-1 text-sky-600 hover:text-sky-800 text-xs font-semibold cursor-pointer"
              >
                <IconEye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
            </div>


<div className="pt-1 flex justify-center">
  <button
  type='button'
  className="w-3/5 bg-[#0a1931] text-white py-2 rounded-xl text-xs font-semibold hover:bg-[#153462] transition-colors cursor-pointer">
Make a Descision
  </button>
  </div>
</div>
      ))}
        </div>  
        </div>


  )
}

