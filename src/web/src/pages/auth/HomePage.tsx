import { useState } from 'react';
/*import {
  IconShield,
  IconUsers,
  IconMapPin,
  IconLock,
  IconRobot,
  IconPackage,
  IconStar,
  IconArrowRight,
  IconCheck,
} from '@tabler/icons-react'*/
import logo from "../../assets/logo.jpeg"
import { useNavigate } from 'react-router-dom';

/*interface StatProps {
  number: string;
  label: string;
}*/

/*function Stat({ number, label }: StatProps) {
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-white">{number}</p>
      <p className="text-sm text-blue-200 mt-1">{label}</p>
    </div>
  );
}*/

/*interface ProblemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}*/

/*function ProblemCard({ icon, title, description }: ProblemCardProps) {
  return (
    <div className="bg-white/90 dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
      <div className="w-12 h-12 bg-blue-100 dark:bg-navy-700 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-navy-700 dark:text-white text-lg mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}*/

/*interface SolutionCardProps {
  icon: React.ReactNode;
  title: string,
  description: string;
}*/

/*function SolutionCard({ icon, title, description }: SolutionCardProps) {
  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-all duration-200 group">
      <div className="w-11 h-11 bg-navy-700 text-white rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-navy-700 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}*/

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-900 text-navy-700 dark:text-white">
      <Navbar />
    </div>
  )
}