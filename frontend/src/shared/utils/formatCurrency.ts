// Formatea un número como pesos colombianos: 65000 -> "$65.000"
export const formatCurrency = (value: number): string =>
  `$${Math.round(value).toLocaleString('es-CO')}`;