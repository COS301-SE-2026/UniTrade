import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
//import API from "../../api/API";
import girl from "../../assets/girl.png";


const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
 const navigate = useNavigate();
 const [error,setError] = useState<string | null>(null) ;
 const [loading,setLoading] = useState(false);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const { name, value } = e.target;
setFormData(prevState => ({
  ...prevState,
  [name]: value,
}));     
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  const API = (window as any).API || { post: async () => ({ data: {} }) };// for testing
  try {
    const response = await API.post('/auth/Login',{email: formData.email, password: formData.password });
    //localStorage.setItem('token', response.data.token);
   if(response.data && response.data.token) {
     navigate('/buyer/dashboard');
   }
  }catch (error) {
    setError('Invalid email or password');
  } finally {
    setLoading(false);
  }
  };

return(
  <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
  <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">



{/*left side*/}
<div className="flex w-full flex-col justify-center px-12 py-16 md:w-1/2 lg:px-20">
<div className="mb-10">
<h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Welcome Back!</h1>
<p className="mt-2 text-sm text-gray-500">Enter your credentials to access your account</p>
</div>


 <form className="space-y-6" onSubmit={handleSubmit}>
   <div>

{/*error block popup for validation*/}
{error && (
  <div className="rounded-md bg-red-100 p-4">
    <p className="text-sm text-red-700">{error}</p>
  </div>
)}


<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Email Address</label>
  <input
  type="email"
  name="email"
  value={formData.email}onChange={handleChange}
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Email Address"
  required
/>

</div>
<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Password</label>
  <input
  type="password"
  name="password"
  value={formData.password} onChange={handleChange}
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Password"
  required
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
disabled={loading}
className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md disabled:opacity-50"
>
{loading ? 'Logging in...' : 'LOGIN'}
</button>
</form>

<div className="mt-8 text-center text-sm text-gray-600">
Don't have an account? <a href="/auth/Signup" className="font-bold text-sky-900 hover:underline">Sign Up</a>
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
export default Login;
