import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import girl from "../../assets/girl.png";
import { IconEmailStamp } from "@tabler/icons-react";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName:'',
    lastName: '',
      email: '',
      university:'',
      degreeProgram:'',
      yearOfStudy:'',
      password: '',
    });

    const [error,setError] = useState<string | null>(null) ;
     const [loading,setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
   const { name, value } = e.target;
   setFormData(prev=> ({
     ...prev,
     [name]: value,
   }));     
    };

  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  const API = (window as any).API || { post: async () => ({ data: {} }) };// for testing
  try {
    const response = await API.post('/auth/Signup',{
      firstName: formData.firstName,
      lastName:formData.lastName,
      email:formData.email,
      university:formData.university,
      degreeProgram:formData.degreeProgram,
      yearOfStudy:formData.yearOfStudy,
      password:formData.password,
    });
   
   if(response.data && response.data.token) {
     navigate('/buyer/dashboard');
   }
  }catch (err) {
    setError('Signup failed.Please check your detils and try again');
  } finally {
    setLoading(false);
  }
  };



 return(
  <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
  <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">



{/*left side*/}
<div className="flex w-full flex-col justify-center px-12 py-12 md:w-3/5 lg:px-20">
<div className="mb-8">
<h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Get Started</h1>
</div>


 <form className="space-y-4" onSubmit={handleSubmit}>
{/*error block popup for validation*/}
{error && (
  <div className="rounded-md bg-red-100 p-4">
    <p className="text-sm text-red-700">{error}</p>
  </div>
)}


<div className="grid grid-cols-2 gap-4">
 <div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">First Name</label>
  <input
  type="text"
  name="firstName"
   placeholder="First Name"
   value={formData.firstName}
   onChange={handleChange}
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
   </div>
    <div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Last Name</label>
  <input
  type="text"
  name="lastName"
  value={formData.lastName}
  onChange={handleChange}
   placeholder="Last Name"
   required
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
   </div>

</div>
   
   <div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Email</label>
  <input
  type="email"
  name="email"
  value={formData.email}
   onChange={handleChange}
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Email"
 />
   </div>

<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">University</label>
  <select 
  name="university"
  value={formData.university}
  onChange={handleChange}
  required
   className=" text-gray-400 w-full rounded-xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  >
  <option className="text-gray-300"value ="">Select University</option>
  <option className="text-gray-900" value="UCT">University of Cape Town</option>
  <option className="text-gray-900" value="UJ">University of Johannesburg</option>
  <option className="text-gray-900" value="SU">Stellenbosch University</option>
  <option className="text-gray-900" value="WITS">University of the Witwatersrand</option>
  <option className="text-gray-900" value="UP">University of Pretoria</option>
  <option className="text-gray-900" value="NWU">North-West University</option>
  <option className="text-gray-900" value="RU">Rhodes University</option>
 <option className="text-gray-900" value="UFH">University of Fort Hare</option>
  <option className="text-gray-900" value="UKZN">University of KwaZulu-Natal</option>

 </select>
   </div>

<div className="grid grid-cols-2 gap-4">
<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Degree Program</label>
  <input
  type="text"
  name="degreeProgram"
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  placeholder="Degree Program"
  value={formData.degreeProgram}
  onChange={handleChange}
 />
   </div>

<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Year of Study</label>
  <input
  type="text"
  name="yearOfStudy"
   value={formData.yearOfStudy}
  onChange={handleChange}
  placeholder="Year of Study"
  required
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
  
 />
   </div>
</div>

<div>
<label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Password</label>
  <input
  type="password"
  name="password"
   value={formData.password}
  onChange={handleChange}
  placeholder="Password"
  required
  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"


 />
   </div>

<button
type="submit"
disabled={loading}
className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md disabled:opacity-50"
>
{loading ? 'Signing up...' : 'SIGNUP'}
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
