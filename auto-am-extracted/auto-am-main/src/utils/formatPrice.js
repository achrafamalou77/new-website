export function formatPrice(amount) {
  return (
    new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' DA'
  );
}
