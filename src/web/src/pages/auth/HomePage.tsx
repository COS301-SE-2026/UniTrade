//the home page ( hte landing page) where the user will see the login and signup and what we offer 
import{
    IconMessage,
    IconMapPin,
    IconShieldCheck,
    IconRobot,
}from '@tabler/icons-react'
import React from 'react'
import image from '../../assets/image.jpeg'
import{ useNavigate} from 'react-router-dom'

function Navbar(){
    const navigate = useNavigate()

    return(
        <header className = "flex items-center justify-between px-8 py-4 bg-white shadow-sm">
             
      <h1 className="text-2xl font-bold text-[#003366]">UniTrade</h1>

      
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/auth/Login')}
          className="px-6 py-2 bg-[#003366] text-white rounded font-semibold hover:bg-[#002244] transition-colors"
        >
          LOGIN
        </button>
        <button
          onClick={() => navigate('/auth/Signup')}
          className="px-6 py-2 bg-[#003366] text-white rounded font-semibold hover:bg-[#002244] transition-colors"
        >
          SignUp
        </button>
      </div>
        </header>
    )
}

function ImageSection(){
    return (
    <div
      className="relative w-full h-[500px] flex items-center"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'right-center',
      }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 px-12">
        <h2 className="text-white text-5xl font-extrabold uppercase leading-tight max-w-lg">
          University Materials Made Accessible
        </h2>
      </div>
    </div>
  )
}

function DownloadSection(){
    return(
        <div className = "relative w-full bg-[#003366] py-12 flex flex-col items-center justify-center" >

            <h2 className = "text-white text-2xl font-bold mb-8 tracking-wide">
                GET THE APP
            </h2>

            <div className = "flex items-center gap-6">

                <button className = "flex items-center gap-2 bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-900 transition-colors">
                    <span className = "text-2xl"></span>
                    <div className = "text-left">
                     <p className="text-[10px] text-gray-400">Download on the</p>
                     <p className="text-sm font-semibold">App Store</p>
                     </div>
                </button>
            

             <button className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-900 transition-colors">
             <span className="text-2xl">▶</span>
             <div className="text-left">
             <p className="text-[10px] text-gray-400">GET IT ON</p>
             <p className="text-sm font-semibold">Google Play</p>
          </div>
        </button>

            </div>
        </div>
    )
}

const features = [
    {
        icon: <IconMessage size={32} className="text-[#003366]" />,
        title: 'Real-Time Chat',
        description: 
        'Connect instantly with buyers and sellers through our secure in-app messaging system to discuss item details and coordinate exchanges.',
    },
    {
        icon: <IconMapPin size={32} className="text-[#003366]" />,
        title: 'Location Pickup',
        description:
        'Easily find and arrange safe meeting point on or near campus for convenient, face-to-face material handovers.',
    },
    {
        icon: <IconShieldCheck size={32} className="text-[#003366]" />,
        title: 'Secure Payments',
        description:
        'Experience peace of mind with our protected transaction processing, ensuring your funds are handles safely and reliably.',
    },
    {
        icon: <IconRobot size={32} className="text-[#003366]" />,
        title: 'AI Verification',
        description:
        'Shop with confidence using our smart verification system that authenticates listings and confirms student status to maintain a trusted community.',
    },
]

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="flex flex-col items-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[#dce9f7] flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-sm font-bold text-[#003366] uppercase mb-2">{title}</h3>
            <p className ="text-xs text-gray-600 leading-relaxed">{description}</p>  
        </div>
    )
}

function WhatWeOffer() {
  return (
    <section className="py-12 px-8 bg-white">
      <h2 className="text-lg font-bold text-gray-800 mb-8">WHAT WE OFFER:</h2>

      <div className="grid grid-cols-4 gap-6 w-full">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}  
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  )
}


export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <ImageSection />
      <WhatWeOffer />
      <DownloadSection />
    </div>
  )
}