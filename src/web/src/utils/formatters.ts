export function formatPrice(amount: number | undefined | null): string {
  if (amount == null || Number.isNaN(amount)) {
    return 'R0'
  }

  const hasDecimals = amount % 1 !== 0
  const formatted = amount.toLocaleString('en-ZA', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })

  return `R${formatted}`
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
    good: 'Good',
    fair: 'Fair',
    worn: 'Worn',
  }
  return map[condition] ?? condition
}