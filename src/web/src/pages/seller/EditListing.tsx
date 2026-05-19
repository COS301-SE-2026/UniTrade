import React, { useState, useEffect } from 'react';
import { IconUpload, IconCheck } from "@tabler/icons-react";

interface ListingData {
title: string;
moduleTag: string;
description: string;
condition: "New" | "Excellent" | "Good";
price: number;
}

const EditListing: React.FC = () => {
  const [formData, setFormData] = useState<ListingData>({
    title: "",
    moduleTag: "",
    description: "",
    condition: 'Excellent',
    price: 0,
  });

  useEffect(() => {
    setFormData({
        title: "Financial Economics and Statistics 16th Edition",
        moduleTag: "ECN301",
        description: "This textbook is in excellent condition, with only minor signs of wear. It has been well cared for and is free from any major damage or markings. The pages are clean and intact, making it a great resource for students studying financial economics and statistics.",
        condition: "Excellent",
        price: 500,
    })
  }, []);

  const handleChange =(field: keyof ListingData, value: string ) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  return ( 
    <div className="max-w-4xl w-full mx-auto space-y-6 pb-24 p-6">
    <div>
      <h2 className="text-2xl font-bold text-[#0F2D5E]" tracking-tight>Edit Listing</h2>
      <p className="text-xs text-slate-400 mt-1"> Update your Listing details down below.</p>
      </div>

        {/*steps tracker*/}
         <div className="relative pl-12 space-y-8 mt-6">
         <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200"></div>  
         
        {/*Basic info block*/}
    
          <div className="relative">
    
            {/*aCTIVE circles*/}
    
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
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                 placeholder="Title"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"/>
              </div>
              
              <div>
                <select 
                value={formData.moduleTag}
                onChange={(e) => handleChange("moduleTag", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer">
               
                  <option value="">Module Tags</option>
                  <option value="ECN301">ECN301</option>
                    <option value="INF204">INF204</option>
                    <option value="WTW114">WTW114</option>
                </select>
              </div>
            </div>
          <div>
          <textarea
          value={formData.description
          }
          onChange={(e) => handleChange("description",e.target.value)}
          placeholder="Description"
        rows={3}
        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"/>
          </div>
        </div>
       </div>
       </div>

    
      {/*Step 2: Pictures*/}
           <div className="relative">
    
            <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-200"><IconCheck size={16} stroke={2}/> </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-44 pt-2 shrink-0">
            <h3 className="text-sm font-bold text-slate-900">Step 2: Pictures</h3>
          </div>
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0F2D5E]" border-b-border-slate-100 pb-2>Images<span className="text-xs font-normal text-slate-400">(Drag & Drop or Upload)</span></h4>
    
            <div className="grid grid-cols-4 gap-4">
                    <div className="aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center p-2">
                      <div className="w-full h-full bg-red-100 border border-red-200 rounded shadow-xs flex flex-col items-center justify-center p-1 text-center text-[7px] font-black text-red-700 leading-none">
                        FINANCIAL ECONOMICS
                      </div>
                    </div>
                 {[1, 2, 3].map((idx) => (
                      <button key={idx} type="button" className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-400 transition-colors group">
                        <IconUpload size={20} className="mb-1 group-hover:scale-110 transition-transform"/>
                      </button>
                  ))}
                  </div>
                  <p className="text-[10px] text-slate-400">Up to 5 photos, max 10MB each.</p>
              </div>
            </div>
          </div>


 {/*Step 3: Price*/}
       <div className="relative">

        <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-200"><IconCheck size={16} stroke={2}/> </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-44 pt-2 shrink-0">
        <h3 className="text-sm font-bold text-slate-900">Step 3: Price</h3>
      </div>
      <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-[#0F2D5E]" border-b-border-slate-100 pb-2>Pricing</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 ">Price (ZAR)</label>
            <div className="relative rounded-xl shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-600 font-medium text-sm">R</span>
          </div>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => handleChange("price",e.target.value)}
           className="w-full bg-sky-200/70 border border-transparent rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-[#0F2D5E] focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
        </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Condition</label>
            <div className="flex gap-4 pt-1">
              {(["New", "Excellent", "Good"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>handleChange("condition", item)}
                  className={`text-xs font-bold tracking-wide transition-all $
                  {condition === item ? "text-slate-900 underline underline-offset-4 decoration-2 decoration-sky-500" : "text-slate-400 hover:text-slate-600"
                  }`}
                  >{item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>

       </div>
       </div>
  );};

  export default EditListing;