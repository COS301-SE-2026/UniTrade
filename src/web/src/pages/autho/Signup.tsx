import React, {useState} from "react";
import girl from "../../assets/girl.png";

const Signup: React.FC = () => {
 return(
  <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
  <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">



{/*left side*/}
<div className="flex w-full flex-col justify-center px-12 py-12 md:w-1/2 lg:px-20">
<div className="mb-18">
<h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Get Started</h1>
</div>


 <form className="space-y-4">
{[
    { label: "Name",
        type: "text",
        placeholder: "Name"},
    {
        label: "Email Address",
        type: "email",
        placeholder: "Email Address"
    } ,  

    {   
        label: "University",
        type: "text",
        placeholder: "University"
    },
    {
       label: "Degree Program",
        type: "text",
        placeholder: "Degree Program"
    },
    {
        label: "Year of Study",
        type: "text",
        placeholder: "Year of Study"    
    },{
        label: "Password", type: 'password',placeholder: ''
        
    },
    ].map((field) => (
        <div key={field.label}>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">{field.label}</label>
        <input
        type={field.type}
        className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"/>
</div>
    ))}


<button
type="submit"
className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md"
>
SIGNUP
</button>
</form>

<div className="mt-8 text-center text-sm text-gray-600">
Already have an account?<a href="#" className="font-bold text-sky-900 hover:underline">SignUp</a>
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
