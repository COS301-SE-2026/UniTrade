export const DISPLAY_CATEGORY_NAMES: Record<string, string> = {
    book: 'Textbooks',
    clothing: 'Clothing',
    electronics: 'Electronics',
    furniture: 'Furniture',
    other: 'Other',
    stationery: 'Stationery',
};

export function getDisplayCategory(raw: string): string {
    return DISPLAY_CATEGORY_NAMES[raw] ?? raw;
}

export function sortTheCategories(categories: { id: number, name: string}[]): typeof categories {
    const book = categories.find(c => c.name === 'book');
    const other = categories.find(c => c.name === 'other');
    const rest = categories.filter(c => c.name !== 'book' && c.name !== 'other');
    rest.sort((a,b) => 
    getDisplayCategory(a.name).localeCompare(getDisplayCategory(b.name)));
    const result: typeof categories = [];
    if(book) result.push(book);
    result.push(...rest);
    if(other) result.push(other);
    return result;
}