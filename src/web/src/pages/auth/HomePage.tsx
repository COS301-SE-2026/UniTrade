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
  //IconCheck,
} from '@tabler/icons-react'
import logo from "../../assets/logo.jpeg"
import { useNavigate } from 'react-router-dom';

interface StatProps {
  number: string;
  label: string;
}

function Stat({ number, label }: StatProps) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white mx-5">{number}</p>
      <p className="text-sm text-gray-400 mt-1 mx-5 whitespace-nowrap">{label}</p>
    </div>
  );
}

interface ProblemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ProblemCard({ icon, title, description }: ProblemCardProps) {
  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-all duration-200 group">
      <div className="w-11 h-11 bg-navy-700 text-white rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
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

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex-1 relative">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-navy-700 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
          {number}
        </div>
      <div>
      <h3 className="font-semibold text-navy-700 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </div>
    </div>
  )
}
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate()
  return (
    <nav className="bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-white/10 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img
              src={logo}
              alt="UniTrade Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/120x40/0d1f4e/white?text=UniTrade";
              }}
            />
          </div>
          <h1 className="font-bold text-navy-700 dark:text-white text-3xl mb-2">UniTrade</h1>
        </div>


        <div className="hidden md:flex items-center gap-8 text-sm font-medium ml-auto mr-4">
          <a href="#problem" className="hover:text-navy-500 dark:hover:text-blue-400 transition-colors">The Problem</a>
          <a href="#solution" className="hover:text-navy-500 dark:hover:text-blue-400 transition-colors">The Solution</a>
          <a href="#how-it-works" className="hover:text-navy-500 dark:hover:text-blue-400 transition-colors">How it works</a>
          <a href="#for-buyers" className="hover:text-navy-500 dark:hover:text-blue-400 transition-colors">For buyers</a>
          <a href="#for-sellers" className="hover:text-navy-500 dark:hover:text-blue-400 transition-colors">The sellers</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/auth/Signup')}
            className="bg-navy-700 hover:bg-navy-600 text-white px-6 py-2.5 text-sm font-semibold rounded-full transition-colors">
            Get Started
          </button>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6H16M4 12H16M4 18H16" />
            </svg>
          </button>
        </div>


      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-navy-800 py-4 px-6 space-y-4 text-sm">
          <a href="#problem" className="block py-2">The Problem</a>
          <a href="#solution" className="block py-2">The Solution</a>
          <a href="#how-it-works" className="block py-2">How it works</a>
          <a href="#for-buyers" className="block py-2">For buyers</a>
          <a href="#for-sellers" className="block py-2">For sellers</a>
        </div>
      )}
    </nav>
  )
}

function Firstpage() {
  return (
    <div className="min-h-screen bg-navy-700 pt-16 pb-20 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-blue-400 text-xs font-medium px-4 py-1.5 rounded-full mb-6 ml-auto mt-1">
        <span className="bg-green-400 w-2 h-2 rounded-full animate-pulse"></span>
        MADE FOR SA UNIVERSITY STUDENTS
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto max-w-100">
          Buy and sell University materials <span className="text-blue-400">on your campus</span>
        </h1>
       
       <p className="mt-6 text-al text-gray-400 max-w-2xl mx-auto">
        UniTrade is the verified peer-to-peer marketplace for South African students.
        No shipping, no strangers - just your campus community.
       </p>
      </div>

      <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
        <Stat number="5+" label="SA UNIVERSITIES" />
        <Stat number="100%" label="VERIFIED STUDENTS" />
        <Stat number="0" label="SHIPPING FEES" />
      </div>
    </div>
  )
}

function Theproblem() {
  return (
    <div id="problem" className="bg-gray-100 mx-auto px-6 py-20">
      <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <span className="uppercase text-s tracking-widest font-mono text-red-500">THE PROBLEM</span>
        <h2 className="text-3xl font-bold text-navy-700 dark:text-white mt-3">
          Common marketplaces fail university students
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Existing sites and platforms are built for anyone and everyone, making them not suitable for students.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProblemCard
         icon={<IconShield size={28} className="text-red-600" />}
         title="Safety concerns"
         description="Meeting strangers from the internet creates real risks and major safety concerns. Students have been scammed, robbed, or worse through anonymous platforms."/>

         <ProblemCard
         icon={<IconUsers size={28} className="text-amber-600" />}
         title="Lack of accountability"
         description="Anonymous sellers can disappear after a bad transaction. There is no community to hold people accountable."/>

         <ProblemCard
         icon={<IconMapPin size={28} className="text-blue-600" />}
         title="Inconvenience meetup locations"
         description="Coordinating with people across a city or country is time consuming. Students need a marketplace that works within their daily campus routine."/>
      </div>

      </div>
    </div>
  )
}

function Thesolution() {
  return (
    <div id="solution" className="bg-white dark:bg-navy-950 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="uppercase text-s tracking-widest font-mono text-blue-400">THE SOLUTION</span>
          <h2 className="text-4xl font-bold text-navy-700 dark:text-white mt-3">
            Everything a student markerplace needs
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Built specifically for SA campus life</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           <SolutionCard
            icon={<IconUsers size={26} />}
            title="Verified students only"
            description="Every use is verified against their university student email. No outsiders, no scammers - just you campus community."
            />
            <SolutionCard
            icon={<IconMapPin size={26} />}
            title="Meet on campus"
            description="Every transaction happens in person at a campus location you both agree on. Inspect before you pay ALWAYS."
            />
            <SolutionCard
            icon={<IconLock size={26} />}
            title="Secure payments via OZOW"
            description="Pay instantly via OZOW. No cash handling (unless there is an agreement with the seller), no bank transfer - just a quick scan and a PIN confirmation."
            />
            <SolutionCard
            icon={<IconRobot size={26} />}
            title="AI listing verification"
            description="Every listing is scanned by AI before going live. Fake photos and duplicate listings are caught before buyers ever see them."
            />
            <SolutionCard
            icon={<IconPackage size={26} />}
            title="Bundle packs"
            description="First year? Reserve a full set of textbooks from one seller is a single transaction. No need to meet 10 different people."
            />
            <SolutionCard
            icon={<IconStar size={26} />}
            title="Trust and reputation"
            description="Every buyer and seller builds a reputation score from real transactions. See ratings and reviews before you commit."
            />
        </div>
      </div>
    </div>
  )
}

function Howitworks() {
  return (
  <div id="how-it-works" className="bg-gray-100 mx-auto px-6 py-20">
    <div className="text-center mb-12">
      <span className="uppercase text-s tracking-widest font-mono text-blue-400">HOW IT WORKS</span>
      <h2 className="text-4xl font-bold text-navy-700 dark:text-white mt-3">From listing to handover in 4 steps</h2>
      <p className="mt-3 text-gray-600 dark:text-gray-400">The whole process is designed around campus life fast, safe, and simple.</p>
    </div>

    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start relative">
      <Step 
      number={1}
      title="Browse listings"
      description="Search by course code, university or category. Filter by condition and price"
      />
      <div className="my-8 text-blue-500"> {<IconArrowRight size={26} />} </div>
      
      
      <div className="hidden md:block  absolute "/>
        <Step 
      number={2}
      title="Reserve the item"
      description="Express interest to hold the item for 24 hours. Chat with the seller to arrange a meetup."
      />
       <div className="my-8 text-blue-500"> {<IconArrowRight size={26} />} </div>
      <div className="hidden md:block absolute"/>
        <Step 
      number={3}
      title="Meet on Campus"
      description="Agree on a campus location. Both parties check in on arrival for accountability."
      
      />
       <div className="my-8 text-blue-500"> {<IconArrowRight size={26} />} </div>
      <div className="hidden md:block absolute"/>
          <Step 
      number={4}
      title="Inspect and pay"
      description="Check the item first. Satisfied? Pay via OZOW and confirm with a PIN. Done."
      />
    </div>
  </div>
  )
}
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-900 text-navy-700 dark:text-white">
      <Navbar />
      <Firstpage />
      <Theproblem />
      <Thesolution />
      <Howitworks />
    </div>
  )
}