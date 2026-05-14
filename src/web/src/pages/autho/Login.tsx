import React, {useState} from "react";
import girl from "../../assets/girl.png";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

return(
  <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
  <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">



{/*left side*/}
<div className="flex w-full flex-col justify-center px-12 py-16 md:w-1/2 lg:px-20">
<div className="mb-10">
<h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Welcome Back!</h1>
<p className="mt-2 text-sm text-gray-500">Enter your credentials to access your account</p>
</div>
 <form className="space-y-6">
<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Name</label>
  <input
  type="text"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Name"
   />
   </div>
   <div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Email Address</label>
  <input
  type="email"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Email Address"
/>
</div>

  <div className="flex items-center justify-between text-xs">
  <label className="flex items-center space-x-2 cursor-pointer text-gray-600">
  <input type="checkbox" className="h-4 w-4 rounded-full border-sky-300 text-sky-600 focus:ring-sky-500" />
   <span>Remember Me</span>
</label>
<a href="#" className="font-bold text-sky-900 hover:underline">Forgot Password</a>
 </div>

<button
type="submit"
className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md"
>
LOGIN
</button>
</form>

<div className="mt-8 text-center text-sm text-gray-600">
Don't have an account?<a href="#" className="font-bold text-sky-900 hover:underline">SignUp</a>
</div>
</div>

    </div>
    
    
</div>
  
);
};
export default Login;
