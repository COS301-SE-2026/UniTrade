import React from 'react';
import {useNavigate} from 'react-router-dom';
import {
IconTrendingUp,IconPlus,IconDots,IconCalendar,
} from '@tabler/icons-react';

const SellerDashboard: React.FC = () =>
  {
	const navigate = useNavigate();
  const recentOrders = [{id: '11001',date: '2026-04-22',customer:'Sabira',status:'Pending', color: 'bg-orange-100 text-orange-600'}, 
    {id: '11002',date: '2026-04-20',customer:'Mahadio',status:'Delivered', color: 'bg-green-100 text-green-600'}, 
    {id: '11003',date: '2026-03-11',customer:'Tafadzwa',status:'Delivered', color: 'bg-green-100 text-green-600'},
     {id: '111004',date: '2026-03-07',customer:'Zelemane',status:'Delivered', color: 'bg-green-100 text-green-600'}, 
     {id: '11005',date: '2025-09-26',customer:'Langa',status:'Cancelled', color: 'bg-red-100 text-red-600'}]; // Placeholder for recent orders data
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

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
{/*Recent Orders Table*/}
<div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 ">
  <div className="flex justify-between items-center mb-8">
    <h2 className="text-xl font-bold text-gray-800 ">Recent Orders</h2>
    <button className="flex items-center gap-2 text-xs font-bold border rounded-xl px-4 py-2 bg-slate-50 text-gray-600 hover:bg-slate-100 transition colors>">
      All<IconDots size={16}/>
    </button>
  </div>
  <table className="w-full">
    <thead>
      <tr className="text-xs font-bold text-gray-400 border-b uppercase tracking-wider">
        <th className="pb-4 text-left ">Order ID</th>
        <th className="pb-4 text-left ">Date</th>
        <th className="pb-4 text-left">Customer</th>
        <th className="pb-4 text-left">Status</th>
      </tr>
    </thead>
    <tbody className="text-sm">
      {recentOrders.map((order) => (
        <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
          <td className="py-5 font-bold text-gray-700">{order.id}</td>
          <td className="py-5 text-gray-500">{order.date}</td>
          <td className="py-5 text-gray-600">{order.customer}</td>
          <td className="py-5 ">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${order.color}`}>
              {order.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/*Sales performance*/}
<div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
  <div className="flex justify-between items-center mb-8">
    <h2 className="text-xl font-bold text-gray-800">Sales Performance</h2>
    <button className="flex items-center gap-2 text-xs font-bold border rounded-xl px-4 py-2 bg-sky-50 text-sky-700">
      Last 7 days<IconCalendar size={16}/>
    </button>
  </div>

  <div className="space-y-5">
    {['Tuesday', 'Monday', 'Sunday', 'Saturday', 'Friday', 'Thursday', 'Wednesday'].map((day) => (
      
    
    <div key={day} className="flex items-center gap-4">
      <span className="text-xs w-20 text-gray-400 font-medium">{day}</span>
      <div className="flex-1 bg-slate-100 rounded-lg h-7 overflow-hidden relative shadow inner">
        <div className="bg-sky-500 h-full w-[88%] flex items-center justify-end pr-4 transition all duration 1000">
          <span className="text-[10px] text-white font-bold tracking-tighter">R1600</span> 
        </div>
  </div>
</div>))}
</div>
</div>
</div>
</div>

);
};

export default SellerDashboard;