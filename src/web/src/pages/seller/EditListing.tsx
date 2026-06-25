import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IconUpload, IconCheck } from "@tabler/icons-react";
import { listingsService } from "../../services/listingsService";
import biologyTextbook from "../../assets/bio-textbook.jpg";

interface ListingData {
  title: string;
  category: "Textbook" | "Electronics" | "Furniture" | "Other";
  moduleTag: string;
  customField: string;
  description: string;
  condition: "Like_New" | "Good" | "Fair" | "Worn";
  price: number;
  images: string[];
}

const conditionMap: Record<string, "Like_New" | "Good" | "Fair" | "Worn"> = {
  like_new: "Like_New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
};

const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ListingData>({
    title: "",
    category: "Other",
    moduleTag: "",
    customField: "",
    description: "",
    condition: "Good",
    price: 0,
    images: [],
  });

  const [existingImages, setExistingImages] = useState<
    { imageId: number; url: string }[]
  >([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [newFiles] = useState<File[]>([]);// set new files
  const removeExisting = (imageId: number) => {
    setRemovedImageIds((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.imageId !== imageId));
  };
  useEffect(() => {
    if (!id) return;
    listingsService
      .getById(id)
      .then((data) => {
        setFormData({
          title: data.title,
          category: "Other",
          moduleTag: data.courseCode ?? "",
          customField: "",
          description: data.description,
          condition: conditionMap[data.condition] ?? "Good",
          price: data.price,
          images: [],
        });

        setExistingImages(
          data.images.map((i) => ({ imageId: Number(i.id), url: i.url })),
        );
      })
      .catch(() => setError("Failed to load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: keyof ListingData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await listingsService.updateListing(id, {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        condition: formData.condition.toLowerCase().replace("_", ""),
        removedImageIds,
      });
      if (newFiles.length > 0) {
        await listingsService.uploadImages(id, newFiles);
      }
      navigate("/seller/listings");
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 pb-24 p-6">
      <div className="mt-6">
        <h2 className="text-2xl font-bold text-[#0F2D5E] tracking-tight">
          Edit Listing
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Update your Listing details down below.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-100 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="relative pl-12 space-y-8 mt-6">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200"></div>

        {/* Step 1: Basic Information */}
        <div className="relative">
          <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-200">
            <IconCheck size={16} stroke={2} />
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-44 pt-2 shrink-0">
              <h4 className="text-sm font-bold text-slate-900">
                Step 1: Basic Information
              </h4>
            </div>
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h4 className="text-sm font-bold text-[#0F2D5E] border-b border-slate-100 pb-2">
                Listing Information
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["Textbook", "Electronics", "Furniture", "Other"] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleChange("category", cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        formData.category === cat
                          ? "bg-[#0F2D5E] text-white border-transparent shadow-sm"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={
                    formData.category !== "Other"
                      ? "md:col-span-2"
                      : "md:col-span-3"
                  }
                >
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {formData.category === "Textbook" && (
                  <div>
                    <select
                      value={formData.moduleTag}
                      onChange={(e) =>
                        handleChange("moduleTag", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                    >
                      <option>Module / Course Tags</option>
                      <option value="WTW114">WTW114</option>
                      <option value="ECN301">ECN301</option>
                    </select>
                  </div>
                )}

                {formData.category === "Electronics" && (
                  <div>
                    <input
                      type="text"
                      value={formData.customField}
                      onChange={(e) =>
                        handleChange("customField", e.target.value)
                      }
                      placeholder="Brand/Model"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                )}

                {formData.category === "Furniture" && (
                  <div>
                    <input
                      type="text"
                      value={formData.customField}
                      onChange={(e) =>
                        handleChange("customField", e.target.value)
                      }
                      placeholder="Dimensions"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description"
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Pictures */}
        <div className="relative">
          <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-200">
            <IconCheck size={16} stroke={2} />
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-44 pt-2 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                Step 2: Pictures
              </h3>
            </div>
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F2D5E] pb-2">
                Images{" "}
                <span className="text-xs font-normal text-slate-400">
                  (Drag & Drop or Upload)
                </span>
              </h4>
              <div className="grid grid-cols-4 gap-4">
                {/* Existing images from API */}
                {existingImages.map((img) => (
                  <div
                    key={img.imageId}
                    className="aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <img
                      src={img.url || biologyTextbook}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(img.imageId)}
                      aria-label="Remove image"
                      className="absolute top-1 right-1 bg-red-500 text-white
                      rounded-full w-5 h-5 text-xs opacity-0
                      group-hover:opacity-100 transition-opacity"
                    >
                      x
                    </button>
                  </div>
                ))}
                {/* Upload slots for remaining spots */}
                {Array.from({
                  length: Math.max(0, 4 - formData.images.length),
                }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-400 transition-colors group"
                  >
                    <IconUpload
                      size={20}
                      className="mb-1 group-hover:scale-110 transition-transform"
                    />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                Up to 5 photos, max 10MB each.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Price */}
        <div className="relative">
          <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-200">
            <IconCheck size={16} stroke={2} />
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-44 pt-2 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                Step 3: Price
              </h3>
            </div>
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F2D5E] pb-2">Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Price (ZAR)
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-600 font-medium text-sm">
                        R
                      </span>
                    </div>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      className="w-full bg-sky-200/70 border border-transparent rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-[#0F2D5E] focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">
                    Condition
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(["Like_New", "Good", "Fair", "Worn"] as const).map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleChange("condition", item)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            formData.condition === item
                              ? "bg-[#0F2D5E] text-white border-transparent shadow-sm"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {item.replace("_", " ")}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Confirmation */}
        <div className="relative">
          <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-sm font-bold">
            4
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-44 pt-2 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                Step 4: Confirmation
              </h3>
            </div>
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F2D5E] border-b border-slate-100 pb-2">
                Summary Overview
              </h4>
              <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-10 h-12 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={
                      existingImages[0]?.url || URL.createObjectURL(newFiles[0])
                    }
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <h5 className="text-sm font-bold text-slate-800 truncate">
                    {formData.title || "Untitled Listing"}
                  </h5>
                  <p className="text-xs text-slate-400">
                    Changes Preview Summary
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => navigate("/seller/listings")}
          className="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors shadow-xs"
        >
          Cancel Changes
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#0F2D5E] text-white rounded-xl text-sm font-bold tracking-wide hover:bg-sky-900 transition-all shadow-md disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditListing;
