// src/lib/number-to-words.ts

export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro'
  if (n < 0) return 'moins ' + numberToFrenchWords(Math.abs(n))
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']

  function convertGroup(num: number): string {
    let result = ''
    const hundreds = Math.floor(num / 100)
    const remainder = num % 100

    if (hundreds > 0) {
      if (hundreds === 1) {
        result += 'cent '
      } else {
        result += units[hundreds] + ' cent' + (remainder === 0 ? 's' : '') + ' '
      }
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += units[remainder]
      } else if (remainder < 20) {
        result += teens[remainder - 10]
      } else {
        const tenDigit = Math.floor(remainder / 10)
        const unitDigit = remainder % 10

        if (tenDigit === 7) {
          result += 'soixante-' + (unitDigit === 1 ? 'et-onze' : teens[unitDigit])
        } else if (tenDigit === 9) {
          result += 'quatre-vingt-' + teens[unitDigit]
        } else {
          result += tens[tenDigit]
          if (unitDigit > 0) {
            result += (unitDigit === 1 ? '-et-un' : '-' + units[unitDigit])
          }
        }
      }
    }

    return result.trim()
  }

  let words = ''
  const billions = Math.floor(n / 1000000000)
  const millions = Math.floor((n % 1000000000) / 1000000)
  const thousands = Math.floor((n % 1000000) / 1000)
  const remainder = Math.floor(n % 1000)

  if (billions > 0) {
    words += convertGroup(billions) + ' milliard' + (billions > 1 ? 's' : '') + ' '
  }
  if (millions > 0) {
    words += convertGroup(millions) + ' million' + (millions > 1 ? 's' : '') + ' '
  }
  if (thousands > 0) {
    if (thousands === 1) {
      words += 'mille '
    } else {
      words += convertGroup(thousands) + ' mille '
    }
  }
  if (remainder > 0) {
    words += convertGroup(remainder)
  }

  return words.trim()
}
