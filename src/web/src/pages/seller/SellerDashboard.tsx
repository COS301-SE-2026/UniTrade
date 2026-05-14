import React from 'react';
import {useNavigate} from 'react-router-dom';
import {
IconClock,IconTrendingUp,IconPlus,
} from '@tabler/icons-react';

const SellerDashboard: React.FC = () =>
  {
	const navigate = useNavigate();

return (
	<div className="p-8 bg-[#F8FAFC] min-h-screen">
	<header className ="mb-8">
	<h1 className ="text-3xl font-extrabold text-gray-900 tracking-tight">WELCOME BACK TAFADZWA</h1>
	</header>


  {/*4 stats blocks*/}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

{/*Total Orders*/}
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="bg-[#0F2D5E] p-3 text-white text-xs font-bold text-center uppercase tracking-wider">Total Orders</div>
  <div className = "p-6">
    <div className="text-4xl font-bold mb-2">15</div>
    <div className="text-green-500 text-xs flex items-center gap-1 font-semibold">
      <IconTrendingUp size={16} /> +12% this month
    </div>
  </div>
</div>

{/*Total Sales*/}
<div className= "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="bg-[#0F2D5E] p-3 text-white text-xs font-bold text-center uppercase tracking-wider">Total Sales</div>
  <div className="p-6"> 
  <div className="text-4xl font-bold mb-2">R1500</div>
  <div className="text-green-500 text-xs flex items-center gap-1 font-semibold">
    <IconTrendingUp size={16} /> +12% this month
  </div>
  </div>
</div>


{/*Pending Delivery*/}
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="bg-[#0F2D5E] p-3 text-white text-xs font-bold text-center uppercase tracking-wider">Pending Delivery</div>
  <div className = "p-6">
    <div className="text-4xl font-bold mb-2">1</div>
    <div className="text-orange-500 text-xs flex items-center gap-1 font-semibold">
      <IconTrendingUp size={16} /> Collection soon
    </div>
  </div>
</div>


{/*New Listing Button*/}
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="bg-[#0F2D5E] p-3 text-white text-xs font-bold text-center uppercase tracking-wider">New Listing</div>
  <button
  onClick={() => navigate('/seller/upload')}
  className="w-full h-24 flex items-center justify-center text-slate-300 group-hover:text-[#0F2D5E] transition-colors">

    <IconPlus size={48} stroke={1.5}/>
  </button>
  </div>
</div>

</div>
);
};

export default SellerDashboard;