import React, { useState } from "react";
import { IconUpload, IconCheck } from "@tabler/icons-react";

const UploadListing: React.FC = () => {
  const [condition, setCondition] = useState<"Like_New" | "Good" | "Fair" | "Worn">("Like_New");
 const [category, setCategory] = useState<"Textbook" | "Electronics" | "Furniture" | "Other">("Textbook");
 
  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 pb-24 p-6">
    <div>
      <h2 className="text-2xl font-bold text-[#0F2D5E]" tracking-tight>Create New Listing</h2>
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
        
      {/*category tabs*/}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {(["Textbook", "Electronics", "Furniture", "Other"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                category === cat ? "bg-[#0F2D5E] text-white border-transparent shadow-sm" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

    {/*Input field*/}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
     <div className={category !== "Other" ? "md:col-span-2" :"md:col-span-3"}>
      <input     type="text"
      placeholder="Title"
    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"/>
</div>
{/*textbook tags*/}
{category === "Textbook" && (
  <div>
    <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer">
                   <option>Module / Course Tags</option>
                    <option value="WTW114">WTW114</option>
                    <option value="ECN301">ECN301</option>
                    </select>
          </div>)}

 {/*electronics specs*/}
{category === "Electronics" && (
  <div>
    <input
    type="text"
    placeholder="Brand / Model"
  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"/>
</div>)}

  {/*furniture specs*/}
  {category === "Furniture" && (
    <div>
      <input
      type="text"
      placeholder="Dimensions"
    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"/>
  </div>)}
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

        {/*Step 2: Pictures*/}
       <div className="relative">

        <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-200"><IconCheck size={16} stroke={2}/> </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-44 pt-2 shrink-0">
        <h3 className="text-sm font-bold text-slate-900">Step 2: Pictures</h3>
      </div>
      <div className="flex-1 w-full bg-white border border=slate-200 rounded-2xl p-6 shadow-sm space-y-4">
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

        <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-200"><IconCheck size={16} stroke={2}/> </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-44 pt-2 shrink-0">
        <h3 className="text-sm font-bold text-slate-900">Step 3: Price</h3>
      </div>
      <div className="flex-1 w-full bg-white border border=slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-[#0F2D5E]" border-b-border-slate-100 pb-2>Pricing</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 ">Price (ZAR)</label>
            <div className="relative rounded-xl shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-500 text-sm">R</span>
          </div>
          <input
            type="number"
           className="w-full bg-sky-200/70 border border-transparent rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-[#0F2D5E] focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
        </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Condition</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {(["Like_New", "Good", "Fair", "Worn"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCondition(item)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
          condition === item 
            ? "bg-[#0F2D5E] text-white border-transparent shadow-sm" 
            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
        }`}
      >
        {item.replace("_", " ")}
      </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>

 {/*Confirmation Summary */}
 <div className="relative">

        <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-sm font-bold">
          4
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-44 pt-2 shrink-0">
            <h3 className="text-sm font-bold text-slate-900">Step 4: Confirmation</h3>
          </div>
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0F2D5E] border-b border-slate-100 pb-2">Summary Overview</h4>
            <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-10 h-12 bg-red-100 border border-red-200 rounded flex items-center justify-center p-0.5 text-center text-[5px] font-black text-red-700 leading-none shadow-xs">
                FINANCIAL ECON
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-800">Financial Economics and Statistics 16th Edition</h5>
                <p className="text-xs text-slate-400">Preview Layout Summary</p>
              </div>
            </div>
          </div>
        </div>
      </div>    
      </div> 

      <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-slate-200">
        <button type="button" className="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors shadow-xs">
        Save Draft
        </button>
        <button type="submit" className="px-6 py-2.5 bg-[#0F2D5E] text-white rounded-xl text-sm font-bold tracking-wide hover:bg-sky-900 transition-all shadow-md">Submit Listing
        </button>
    
</div>
</div>
  );
};

  export default UploadListing;

