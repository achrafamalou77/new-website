import { describe, expect, it } from 'vitest'
import { validateDraft } from '@/app/actions/import'

describe('smart importer validation', () => {
  it('keeps only travel entities for a travel agency', async () => {
    const result = await validateDraft({
      clients: [{ full_name: 'Amine', phone: '0555123456' }],
      trips: [{ title: 'Istanbul Summer', destination: 'Turkey', price: '120 000 DA', duration_days: 7 }],
      cars: [{ brand: 'Toyota', model: 'Yaris', year: 2024 }],
    }, 'travel')

    expect(result.trips).toHaveLength(1)
    expect(result.trips?.[0].price).toBe(120000)
    expect(result.cars).toEqual([])
    expect(result.warnings).toContain('Car showroom records were ignored because this tenant is a travel agency.')
  })

  it('normalizes showroom inventory and rejects travel rows', async () => {
    const result = await validateDraft({
      cars: [
        { brand: 'Toyota', model: 'Yaris', year: '2023', price: '4.500.000 DZD', quantity: '2' },
        { brand: 'Toyota', model: 'Yaris', year: '2023', price: '4.500.000 DZD', quantity: '2', confidence: 95 },
      ],
      trips: [{ title: 'Dubai', destination: 'UAE' }],
    }, 'car_showroom')

    expect(result.cars).toHaveLength(1)
    expect(result.cars?.[0].price).toBe(4500000)
    expect(result.cars?.[0].quantity).toBe(2)
    expect(result.trips).toEqual([])
  })

  it('treats ecommerce as its own vertical', async () => {
    const result = await validateDraft({
      products: [{
        sku: ' tshirt-01 ',
        name: 'Premium T-Shirt',
        category: 'Fashion',
        price: '2 900 DA',
        stock_quantity: '12',
      }],
      orders: [{
        order_number: 'CMD-100',
        customer_name: 'Sara',
        customer_phone: '0555000011',
        total: '3 400 DA',
        fulfillment_status: 'confirmed',
      }],
      trips: [{ title: 'Wrong vertical', destination: 'Nowhere' }],
    }, 'ecommerce', { sourceCount: 2, chunksAnalyzed: 2 })

    expect(result.products).toHaveLength(1)
    expect(result.products?.[0]).toMatchObject({
      sku: 'TSHIRT-01',
      price: 2900,
      stock_quantity: 12,
    })
    expect(result.orders).toHaveLength(1)
    expect(result.orders?.[0].customer_phone).toBe('+213555000011')
    expect(result.trips).toEqual([])
    expect(result.analysis).toMatchObject({
      businessType: 'ecommerce',
      sourceCount: 2,
      chunksAnalyzed: 2,
      totalRows: 2,
    })
  })

  it('dedupes messy rows, keeps good rows, and neutralizes spreadsheet formulas', async () => {
    const result = await validateDraft({
      clients: [
        { full_name: '=HYPERLINK("https://evil.test","click")', phone: '0555123456' },
        { full_name: '=HYPERLINK("https://evil.test","click")', phone: '0555123456', confidence: 95 },
      ],
      trips: [
        { title: 'Omra Ramadan', destination: 'Makkah', price: 'invalid price', duration_days: '' },
        { title: '', destination: 'Bad row', price: '90000' },
      ],
    }, 'travel', { sourceCount: 1, chunksAnalyzed: 1 })

    expect(result.clients).toHaveLength(1)
    expect(result.clients?.[0].full_name.startsWith("'=")).toBe(true)
    expect(result.trips).toHaveLength(1)
    expect(result.trips?.[0]).toMatchObject({
      title: 'Omra Ramadan',
      destination: 'Makkah',
      price: 0,
      duration_days: 1,
    })
    expect(result.trips?.[0].missing_fields).toContain('price')
    expect(result.analysis?.duplicateRowsRemoved).toBeGreaterThanOrEqual(2)
  })
})
