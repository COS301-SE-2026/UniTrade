import React, {useEffect, useState} from "react";
import { useToast } from "../../components/layout/useToast";
import { listingsService } from "../../services/listingsService";
import { getDisplayCategory, sortTheCategories } from "../../utils/categoryUtils";
import type { Category } from "../../types/listing";
import {
    getSavedSearches,
    createSavedSearch,
    deleteSavedSearch,
} from "../../services/realtime/savedSearchServices";
import type { SavedSearch, CreateSavedSearchInput } from "../../services/realtime/savedSearchServices";

export default function SavedSearches() {
const [searches, setSearches] = useState<SavedSearch[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [query, setQuery] = useState("");
const [categoryId, setCategoryId] = useState<number | "">("");
const [minPrice, setMinPrice] = useState<number | "">("");
const [maxPrice, setMaxPrice] = useState<number | "">("");
const [loading, setLoading] = useState(true);
const { showToast } = useToast();

useEffect(() => {
    listingsService
    .getListingsCategories()
    .then(data => {
        setCategories(sortTheCategories(data));
    })
    .catch(() => showToast("error", "Failed to load the categories"));
}, [showToast]);

useEffect(() => {
    getSavedSearches()
    .then(setSearches)
    .catch(() => showToast("error", "Failed to load saved searches"))
    .finally(() => setLoading(false));
}, [showToast]);



}