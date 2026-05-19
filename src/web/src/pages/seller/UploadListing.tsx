import React, { useState } from "react";
import { IconUpload, IconCheck } from "@tabler/icons-react";

const UploadListing: React.FC = () => {
  const [condition, setCondition] = useState<"New" | "Excellent" | "Good">("Excellent");
 
 
  return (

    //*Basic info block*/ 
      <div className="relative">

        <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-200"><IconCheck size={16} stroke={2}/> </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-44 pt-2 shrink-0">
        <h3 className="text-sm font-bold text-slate-900">Step 1: Basic Information</h3>
      </div>
      <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-[#0F2D5E] border-b border-slate-100 pb-2">Listing Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
            type="text"
            placeholder="Title"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"/>
          </div>
          
          <div>
            <select 
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer">
           
              <option>Module Tags</option>
            </select>
          </div>
        </div>
      <div>
      <textarea
      placeholder="Description"
    rows={3}
    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"/>
      </div>
    </div>
   </div>
  </div>
  );
};

  export default UploadListing;

