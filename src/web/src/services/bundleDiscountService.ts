import  {getApiUrl} from "../config";
import type { BundleDiscountSettings } from "../types/Reservations";

async function parse(res: Response, fallback:string): Promise<BundleDiscountSettings> {
    if(res.ok) return (await res.json()) as BundleDiscountSettings;
    const body = await res.json().catch(() => null);
    throw new Error(body?.error == "invalid_bundle_rule" ?
        "Pick 3-10 items and discount between 1% and 30%." : fallback)

}


export async function getBundleDiscount(): Promise<BundleDiscountSettings>
{const res = await fetch(`${getApiUrl()}/bundle-discount`, { credentials: "include" });

    return parse(res, "Could not load your bundle discount.");

}

export async function saveBundleDiscount(rule: {
    minItems: number | null;
    percent:  number | null;
}): Promise<BundleDiscountSettings>
{
    const res = await fetch (`${getApiUrl()}/bundle-discount`,{
        method: "PUT",
        credentials: "include",
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify(rule),
    });
    return parse(res, "Could not save your bundle discount.");
}