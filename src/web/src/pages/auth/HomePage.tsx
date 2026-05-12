//the home page ( hte landing page) where the user will see the login and signup and what we offer 

import{ useNavigate} from 'react-router-dom'

function Navbar(){
    const navigate = useNavigate()

    return(
        <header className = "flex items-center justify-between px-8 py-4 bg-white shadow-sm">
             
      <h1 className="text-2xl font-bold text-[#003366]">UniTrade</h1>

      
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-[#003366] text-white rounded font-semibold hover:bg-[#002244] transition-colors"
        >
          LOGIN
        </button>
        <button
          onClick={() => navigate('/signup')}
          className="px-6 py-2 bg-[#003366] text-white rounded font-semibold hover:bg-[#002244] transition-colors"
        >
          SignUp
        </button>
      </div>
        </header>
    )
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <p className="p-8 text-gray-400">One step at a time .</p>
    </div>
  )
}