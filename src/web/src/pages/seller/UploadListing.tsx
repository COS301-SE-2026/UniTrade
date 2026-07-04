import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IconUpload, IconCheck, IconX } from "@tabler/icons-react";
import { listingsService } from "../../services/listingsService";
import type { Category, Course, ListingCondition } from "../../types/listing";

interface ApiError {
  message: string;
}

const UploadListing: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>("");
 type ListingConditionUi = "Like_New" | "Good" | "Fair" | "Worn";

const [condition, setCondition] = useState<ListingConditionUi>("Like_New");
  const [title, setTitle] = useState("");
  const [customField, setCustomField] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseQuery, setCourseQuery] = useState("");
  const [courseResults, setCourseResults] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);

  const CONDITION_TO_API: Record<typeof condition, ListingCondition> = {
    Like_New: "new",
    Good: "good",
    Fair: "fair",
    Worn: "poor",
  };


  useEffect(() => {
    listingsService
      .getListingsCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategory(cats[0].name);
      })
      .catch(() => setError("Failed to load categories"));
  }, []);

  useEffect(() => {
    if (category !== "book") return;
    const term = courseQuery.trim();
    if (term.length < 2) {
      return;
    }

    const handle = setTimeout(() => {
      setCourseLoading(true);
      listingsService
        .searchCourses(term)
        .then(setCourseResults)
        .catch(() => setCourseResults([]))
        .finally(() => setCourseLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [courseQuery, category]);

  const ActiveCourseResults = useMemo(
    () => (courseQuery.trim().length >= 2 ? courseResults : []),
    [courseQuery, courseResults],
  );

  const moduleTag = useMemo(() => {
    const match = ActiveCourseResults.find(
      (c) =>
        c.courseCode.toLocaleLowerCase() ===
        courseQuery.trim().toLocaleLowerCase(),
    );
    return match ? String(match.courseId) : "";
  }, [courseQuery, ActiveCourseResults]);

  let courseTextStatus = "Pick a module from the list";
  if (courseLoading) {
    courseTextStatus = "Searching...";
  } else if (moduleTag) {
    courseTextStatus = "Module selected";
  }
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  const usedPercent = Math.min(
    (totalSizeBytes / (4 * MAX_SIZE_BYTES)) * 100,
    100,
  );
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);

    const oversized = incoming.filter((f) => f.size > MAX_SIZE_BYTES);
    if (oversized.length > 0) {
      setError(
        `Some files exceed the 10MB limit: ${oversized.map((f) => f.name).join(", ")}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFiles((prev) => {
      const merged = [...prev, ...incoming].slice(0, 4);
      setPreviews(
        merged.map((f, i) =>
          i < prev.length ? previews[i] : URL.createObjectURL(f),
        ),
      );
      return merged;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title || !description || !price || files.length === 0) {
      setError("Please fill in all fields and add at least one image.");
      return;
    }

    if (category === "book" && courseQuery.trim() && !moduleTag) {
      setError("Please pick a module from the list");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const listingId = await listingsService.createListing({
        title,
        description,
        price: Number(price),
        condition: CONDITION_TO_API[condition],
        categoryName: category,
        courseId: moduleTag ? Number.parseInt(moduleTag) : null,
        listingStatus: "live",
      });
      await listingsService.uploadImages(listingId, files);
      navigate("/seller/listings");
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraft = async () => {
    if (!title) {
      setError("Please add a title before saving as draft.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const listingId = await listingsService.createListing({
        title,
        description,
        price: Number(price) || 0,
        condition: CONDITION_TO_API[condition],
        categoryName: category,
        courseId: moduleTag ? Number.parseInt(moduleTag) : null,
        listingStatus: "draft",
      });
      if (files.length > 0) {
        await listingsService.uploadImages(listingId, files);
      }
      navigate("/seller/listings");
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 pb-24 p-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F2D5E] tracking-tight">
          Create New Listing
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Fill in the details below to list your item.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-100 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="relative pl-12 space-y-8 mt-6">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />

        {/* Step 1: Basic Information */}
        <div className="relative">
          <div className="absolute -left-12 top-1.5 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-200">
            <IconCheck size={16} stroke={2} />
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-44 pt-2 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                Step 1: Basic Information
              </h3>
            </div>
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F2D5E] border-b border-slate-100 pb-2">
                Listing Information
              </h4>

              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-2">
                  Category
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        category === cat.name
                          ? "bg-[#0F2D5E] text-white border-transparent shadow-sm"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={
                    category === "other" ? "md:col-span-3" : "md:col-span-2"
                  }
                >
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {category === "book" && (
                  <div>
                    <input
                      type="text"
                      list="course-options"
                      placeholder="Module (e.g. COS110)"
                      value={courseQuery}
                      onChange={(e) => setCourseQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 "
                    />
                    <datalist id="course-options">
                      {ActiveCourseResults.map((c) => (
                        <option key={c.courseId} value={c.courseCode}>
                          {c.courseName}
                        </option>
                      ))}
                    </datalist>
                    {courseQuery.trim().length >= 2 && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {courseTextStatus}
                      </p>
                    )}
                  </div>
                )}

                {category === "electronics" && (
                  <div>
                    <input
                      type="text"
                      placeholder="Brand / Model"
                      value={customField}
                      onChange={(e) => setCustomField(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                )}

                {category === "furniture" && (
                  <div>
                    <input
                      type="text"
                      placeholder="Dimensions"
                      value={customField}
                      onChange={(e) => setCustomField(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>

              <textarea
                placeholder="Description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
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

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="grid grid-cols-4 gap-4">
                {previews.map((url, idx) => (
                  <div
                    key={url}
                    className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative"
                  >
                    <img
                      src={url}
                      alt={`preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <IconX size={10} />
                    </button>
                  </div>
                ))}

                {Array.from({ length: Math.max(0, 4 - previews.length) }).map(
                  (_, idx) => {
                    const slot = previews.length + idx;
                    return (
                      <button
                        key={`upload-slot-${slot}`}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-400 transition-colors group"
                      >
                        <IconUpload
                          size={20}
                          className="mb-1 group-hover:scale-110 transition-transform"
                        />
                      </button>
                    );
                  },
                )}
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Up to 4 photos, max 10MB each</span>
                  {files.length > 0 && (
                    <span
                      className={
                        totalSizeBytes > 35 * 1024 * 1024
                          ? "text-amber-500 font-semibold"
                          : ""
                      }
                    >
                      {totalSizeMB} MB used ({files.length}/4 photos)
                    </span>
                  )}
                </div>
                {files.length > 0 && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usedPercent > 87 ? "bg-amber-400" : "bg-sky-500"
                      }`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                )}
              </div>
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
                      <span className="text-slate-500 text-sm">R</span>
                    </div>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-sky-200/70 border border-transparent rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-[#0F2D5E] focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 mb-2">
                    Condition
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(["Like_New", "Good", "Fair", "Worn"] as const).map(
                      (item) => (
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
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                  {previews[0] ? (
                    <img
                      src={previews[0]}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200" />
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">
                    {title || "Untitled Listing"}
                  </h5>
                  <p className="text-xs text-slate-400 capitalize">
                    {category} · R{price || "0"} · {condition.replace("_", " ")}
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
          onClick={handleDraft}
          disabled={submitting}
          className="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 bg-[#0F2D5E] text-white rounded-xl text-sm font-bold tracking-wide hover:bg-sky-900 transition-all shadow-md disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Listing"}
        </button>
      </div>
    </div>
  );
};

export default UploadListing;
