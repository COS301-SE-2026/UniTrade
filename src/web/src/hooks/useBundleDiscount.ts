import { useQuery } from "@tanstack/react-query";
import { getBundleDiscount } from "../services/bundleDiscountService";

export const bundleDiscountKey = ["bundle-discount"] as const;
export const useBundleDiscount = () => 
    useQuery({ queryKey: bundleDiscountKey, queryFn: getBundleDiscount });