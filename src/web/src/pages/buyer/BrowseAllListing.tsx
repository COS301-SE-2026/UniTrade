import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '../../store/useAuthStore'
import calculasTextbook from '../../assets/calculas-textbook.jpg'
import pencil from '../../assets/mechanical-pencil.jpg'
import laptop from '../../assets/hp-laptop.jpg'
import {useState} from 'react'

function CategoryCard({
    title,
    active,
    onClick,
}:{
    title:string
    active: boolean
    onClick: () => void
}) {
    return(
        <button
        onClick={onClick}
        className= {`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${active ? 'bg-[#003366] text-white border-[#003366]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#00336]'}`}
        >
        </button>
    )
}

function ListingCard({
    image,
    title,
    module,
    category,
    price,
    condition,
} : {
    image : string
    title :string
    module : string
    category : string
    price : string
    condition : 'Good' | 'Fair'| 'Poor'
}) {
    const conditionColours = {
        Good : 'bg-green-100 text-green-700',
        Fair : 'bg-yellow-100 text-yellow-700',
        Poor : 'bg-red-100 text-red-700',
    }

    return (
        <div className = "bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover"
            />

            <div className="p-4 flex flex-col gap-2 flex-1">
                <div className = "flex items-start justify-between gap-2">
                    <p className = "text-sm font-semibold text-gray-800">{title}</p>
                    <span className= {`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${conditionStyles[condition]}`}>
                        {condition}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default function BrowseAllListing() {
    const { user} = useAuthStore()
    const [activeCategory, setActiveCategory] = useState('All')
    const categories = ['All', 'Textbooks', 'Electronics', 'Lab Equipment', 'Stationary']

    return (
        <div className = "flex flex-col gap-6">

            <div>
                <h1 className = "text-2xl font-extrabold text-gray-800">Browse All Listings</h1>
                <p className = "text-sm text-gray-400 mt-1">16 listings available at the University Of Pretoria</p>
            </div>

            <div className ="flex items-center justify-between">
                <div className = "flex gap-2">
                    {categories.map((cat) => (
                        <CategoryCard
                            key={cat}
                            title={cat}
                            active={activeCategory === cat}
                            onClick={() => setActiveCategory(cat)}
                        />
                    ))}
                </div>

                <div className="flex gap-2">
                    <select className = "border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#003366]">
                        <option>All conditions</option>
                        <option>Good</option>
                        <option>Fair</option>
                        <option>Poor</option>
                    </select>
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#003366]">
                        <option>Sort: Newest</option>
                        <option>Sort: Oldest</option>
                        <option>Sort: Price Low</option>
                        <option>Sort: Price High</option>
                    </select>
                </div>
            </div>

            /*still nedd to do the products 
            
        </div>
    )
}


