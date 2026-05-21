import React from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '../../store/useAuthStore'
import {
  IconPlus, IconDots, IconCalendar,IconShoppingBag,
  IconCurrencyDollar,
  IconClock,
  } from '@tabler/icons-react';

const SellerDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate();

  const recentOrders = [
    {id: '11001', date: '2026-04-22', customer: 'Sabira',   status: 'Pending',   color: 'bg-yellow-100 text-yellow-700'},
    {id: '11002', date: '2026-04-20', customer: 'Mahadio',  status: 'Delivered', color: 'bg-green-100 text-green-700'},
    {id: '11003', date: '2026-03-11', customer: 'Tafadzwa', status: 'Delivered', color: 'bg-green-100 text-green-700'},
    {id: '111004',date: '2026-03-07', customer: 'Zelemane', status: 'Delivered', color: 'bg-green-100 text-green-700'},
    {id: '11005', date: '2025-09-26', customer: 'Langa',    status: 'Cancelled', color: 'bg-red-100 text-red-600'},
  ];

   const salesDays = [
    { day: 'Tuesday',   amount: 'R1,584', width: '88%' },
    { day: 'Monday',    amount: 'R1,296', width: '72%' },
    { day: 'Sunday',    amount: 'R1,080', width: '60%' },
    { day: 'Saturday',  amount: 'R1,440', width: '80%' },
    { day: 'Friday',    amount: 'R990',   width: '55%' },
    { day: 'Thursday',  amount: 'R1,224', width: '68%' },
    { day: 'Wednesday', amount: 'R810',   width: '45%' },
  ];

  return (
    <div className="flex flex-col gap-6">
    <header>
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">
        Welcome {user?.name?.split(' ')[0] ?? 'Back'}
      </h1>
    </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#003366] px-4 py-2 flex items-center justify-between">
            <p className="text-white text-sm font-bold">Total Orders</p>
            <span className="text-white/70"><IconShoppingBag size={16} /></span>
          </div>
          <div className="px-4 py-3">
            <p className="text-2xl font-bold text-gray-800">15</p>
            <p className="text-xs mt-1 text-green-500">+12% this month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#003366] px-4 py-2 flex items-center justify-between">
            <p className="text-white text-sm font-bold">Total Sales</p>
            <span className="text-white/70"><IconCurrencyDollar size={16} /></span>
          </div>
          <div className="px-4 py-3">
            <p className="text-2xl font-bold text-gray-800">R1500</p>
            <p className="text-xs mt-1 text-green-500">+12% this month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#003366] px-4 py-2 flex items-center justify-between">
            <p className="text-white text-sm font-bold">Pending Delivery</p>
            <span className="text-white/70"><IconClock size={16} /></span>
          </div>
          <div className="px-4 py-3">
            <p className="text-2xl font-bold text-gray-800">1</p>
            <p className="text-xs mt-1 text-orange-400">Collection soon</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#003366] px-4 py-2 flex items-center justify-between">
            <p className="text-white text-sm font-bold">New Listing</p>
            <span className="text-white/70"><IconPlus size={16} /></span>
          </div>
          <button
            onClick={() => navigate('/seller/upload')}
            className="w-full h-[52px] flex items-center justify-center text-slate-300 hover:text-[#003366] transition-colors"
          >
            <IconPlus size={48} stroke={1.5} />
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
            <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              All <IconDots size={12} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs font-bold text-gray-400 border-b border-gray-100 uppercase tracking-wider">
                <th className="pb-3 text-left">Order ID</th>
                <th className="pb-3 text-left">Date</th>
                <th className="pb-3 text-left">Customer</th>
                <th className="pb-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-semibold text-gray-800">{order.id}</td>
                  <td className="py-3 text-gray-400 text-xs">{order.date}</td>
                  <td className="py-3 text-gray-600">{order.customer}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.color}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-800">Sales Performance</h2>
            <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              Last 7 days <IconCalendar size={12} />
            </button>
          </div>

           <div className="space-y-3">
            {salesDays.map(({ day, amount, width }) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{day}</span>
                <div className="flex-1 bg-slate-100 rounded-lg h-7 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full flex items-center justify-end pr-3 rounded-lg transition-all duration-1000"
                    style={{ width }}
                  >
                    <span className="text-[10px] text-white font-bold">{amount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SellerDashboard;

