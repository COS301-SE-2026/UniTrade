import React, {useState} from "react";
import girl from "../../assets/girl.png";

const Signup: React.FC = () => {
 return(
  <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
  <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">



{/*left side*/}
<div className="flex w-full flex-col justify-center px-12 py-12 md:w-3/5 lg:px-20">
<div className="mb-8">
<h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Get Started</h1>
</div>


 <form className="space-y-4">
   
<div className="grid grid-cols-2 gap-4">
 <div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">First Name</label>
  <input
  type="text"
   placeholder="First Name"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
   </div>
    <div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Last Name</label>
  <input
  type="text"
   placeholder="Last Name"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
   </div>

</div>
   
   <div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Email</label>
  <input
  type="email"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Email"
 />
   </div>

<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">University</label>
  <select
  defaultValue=""
  className="w-full rounded-xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  >
  <option value="" disabled hidden>Select University</option>
  <option value="UCT">University of Cape Town</option>
  <option value="UJ">University of Johannesburg</option>
  <option value="SU">Stellenbosch University</option>
  <option value="WITS">University of the Witwatersrand</option>
  <option value="UP">University of Pretoria</option>
  <option value="NWU">North-West University</option>
  <option value="RU">Rhodes University</option>
 <option value="UFH">University of Fort Hare</option>
  <option value="UKZN">University of KwaZulu-Natal</option>

 </select>
   </div>

<div className="grid grid-cols-2 gap-4">
<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Degree Program</label>
  <input
  type="text"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Degree Program"
 />
   </div>

<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Year of Study</label>
  <input
  type="text"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Year of Study"
 />
   </div>
</div>

<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Password</label>
  <input
  type="password"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Password"
 />
   </div>

<button
type="submit"
className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md"
>
SIGNUP
</button>
</form>

<div className="mt-8 text-center text-sm text-gray-600">
Already have an account? <a href="/auth/Login" className="font-bold text-sky-900 hover:underline">Login</a>
</div>
</div>

{/*right side:*/}
<div className="hidden relative md:block md:w-1/2">
  <img 
  src={girl} 
  alt="model-student-holding-books" 
  className="absolute inset-0 h-full w-full object-cover"
  />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/80 via-sky-900/40 to-transparent"></div>
    </div>
    </div>
    
    
</div>
  
);
};
export default Signup;
