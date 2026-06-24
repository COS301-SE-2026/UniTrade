export function formatPrice(amount: number): string {
  return `R${amount.toLocaleString('en-ZA')}`
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatCondition(condition: string): string {
  const map: Record<string, string> = {
    like_new: 'Like New',
    good:     'Good',
    fair:     'Fair',
    worn:     'Worn',
  }
  return map[condition] ?? condition
}