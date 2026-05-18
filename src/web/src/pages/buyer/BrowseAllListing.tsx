import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '../../store/useAuthStore'
import calculasTextbook from '../../assests/calculas-textbook.jpg'
import pencil from '../../mechanical-pencil.jpg'
import laptop from '../../hp-laptop.jpg'
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





