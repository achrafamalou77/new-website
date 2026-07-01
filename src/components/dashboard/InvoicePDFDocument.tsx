import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { numberToFrenchWords } from '@/lib/number-to-words'

interface InvoicePDFDocumentProps {
  invoice: any
}

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#334155'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#4f46e5',
    paddingBottom: 15,
    marginBottom: 20
  },
  logoSection: {
    flexDirection: 'column'
  },
  agencyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
    letterSpacing: 0.5
  },
  agencySlogan: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  agencyContact: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 4
  },
  invoiceTitleSection: {
    alignItems: 'flex-end'
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase'
  },
  invoiceNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginTop: 3,
    fontFamily: 'Helvetica-Bold'
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  billTo: {
    width: '46%',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fafafa'
  },
  billFrom: {
    width: '46%',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fafafa'
  },
  metaHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#4f46e5',
    textTransform: 'uppercase',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2
  },
  boldText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2
  },
  regularText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.35
  },
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 15
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  colDesc: { width: '50%', textAlign: 'left', fontSize: 8 },
  colQty: { width: '12%', textAlign: 'center', fontSize: 8 },
  colPrice: { width: '18%', textAlign: 'right', fontSize: 8 },
  colTotal: { width: '20%', textAlign: 'right', fontSize: 8 },
  
  bottomBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  leftBlock: {
    width: '54%'
  },
  totalsBlock: {
    width: '40%',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f8fafc'
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 8
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingVertical: 4,
    marginTop: 4,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4f46e5'
  },
  prixEnLettresSection: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#4f46e5',
    marginBottom: 12
  },
  ccpSection: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  ccpTextColumn: {
    flex: 1
  },
  ccpTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 2
  },
  ccpGrid: {
    flexDirection: 'row',
    fontSize: 7,
    color: '#1e3a8a'
  },
  
  // High-fidelity QR Code simulation
  qrCodeBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 3,
    backgroundColor: '#ffffff',
    marginRight: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  qrPixelRow: {
    flexDirection: 'row',
    width: 40,
    height: 8
  },
  qrPixelBlack: {
    width: 8,
    height: 8,
    backgroundColor: '#1d4ed8'
  },
  qrPixelWhite: {
    width: 8,
    height: 8,
    backgroundColor: '#ffffff'
  },
  
  termsBlock: {
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 8
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 8
  }
})

export function InvoicePDFDocument({ invoice }: InvoicePDFDocumentProps) {
  const items = (invoice.items as any[]) || []
  const subtotal = invoice.subtotal || 0
  const discountAmount = invoice.discount_amount || 0
  const taxAmount = invoice.tax_amount || 0
  const totalAmount = invoice.total_amount || 0
  const amountPaid = invoice.amount_paid || 0
  const balanceDue = invoice.balance_due || 0

  const prixEnLettres = numberToFrenchWords(totalAmount)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.agencyName}>TRAVEL AGENCY</Text>
            <Text style={styles.agencySlogan}>Algérie Premium Travel SaaS Platform</Text>
            <Text style={styles.agencyContact}>Tél: +213 555 12 34 56 | Email: contact@travelagency.dz</Text>
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>FACTURE VOYAGE / فاتورة</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Client & Company Meta */}
        <View style={styles.metaGrid}>
          <View style={styles.billTo}>
            <Text style={styles.metaHeader}>Facturé à / المشتري (Client)</Text>
            {invoice.client ? (
              <>
                <Text style={styles.boldText}>{invoice.client.full_name}</Text>
                <Text style={styles.regularText}>Tél: {invoice.client.phone || 'Non renseigné'}</Text>
                <Text style={styles.regularText}>Email: {invoice.client.email || 'Non renseigné'}</Text>
                <Text style={styles.regularText}>Adresse: {invoice.client.address || ''}, {invoice.client.city || ''}</Text>
              </>
            ) : (
              <Text style={styles.boldText}>Client voyageur inconnu</Text>
            )}
          </View>

          <View style={styles.billFrom}>
            <Text style={styles.metaHeader}>Détails de l'Échéance / الآجال</Text>
            <Text style={styles.regularText}>Date d'Émission : {invoice.issue_date}</Text>
            <Text style={styles.regularText}>Échéance Limite : {invoice.due_date}</Text>
            <Text style={styles.regularText}>Mode Règlement : {invoice.payment_method || 'CCP'}</Text>
            <Text style={styles.regularText}>Statut Paiement : {invoice.payment_status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Table of Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { fontWeight: 'bold', color: '#1e293b' }]}>Prestations de Voyage / التفاصيل</Text>
            <Text style={[styles.colQty, { fontWeight: 'bold', color: '#1e293b', textAlign: 'center' }]}>Qté</Text>
            <Text style={[styles.colPrice, { fontWeight: 'bold', color: '#1e293b' }]}>P.U (DZD)</Text>
            <Text style={[styles.colTotal, { fontWeight: 'bold', color: '#1e293b' }]}>Montant (DZD)</Text>
          </View>

          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>{(item.unit_price || 0).toLocaleString()}</Text>
              <Text style={styles.colTotal}>{(item.total || 0).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Block */}
        <View style={styles.bottomBlock}>
          {/* Spelled out letters banner */}
          <View style={styles.leftBlock}>
            {/* Prix en Lettres (Highlight banner) */}
            <View style={styles.prixEnLettresSection}>
              <Text style={{ fontSize: 7, color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 3 }}>Arrêtée la présente facture à la somme de (En Lettres) :</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e1b4b', fontFamily: 'Helvetica-Bold' }}>
                {prixEnLettres ? prixEnLettres.charAt(0).toUpperCase() + prixEnLettres.slice(1) : ''} dinars algériens.
              </Text>
            </View>

            {/* CCP & BaridiMob QR Code Column */}
            {invoice.payment_method === 'CCP' && (
              <View style={styles.ccpSection}>
                {/* Simulated high-fidelity QR Code */}
                <View style={styles.qrCodeBox}>
                  <View style={styles.qrPixelRow}>
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                  </View>
                  <View style={styles.qrPixelRow}>
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                  </View>
                  <View style={styles.qrPixelRow}>
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                  </View>
                  <View style={styles.qrPixelRow}>
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                  </View>
                  <View style={styles.qrPixelRow}>
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                    <View style={styles.qrPixelWhite} />
                    <View style={styles.qrPixelBlack} />
                  </View>
                </View>

                <View style={styles.ccpTextColumn}>
                  <Text style={styles.ccpTitle}>CCP & Scan to Pay (BaridiMob)</Text>
                  <Text style={{ fontSize: 7, color: '#1e3a8a', lineHeight: 1.3 }}>
                    CCP: <Text style={{ fontWeight: 'bold' }}>0021876532</Text> Clé: <Text style={{ fontWeight: 'bold' }}>89</Text> {"\n"}
                    Nom: Amalou Achraf | Poste Algérienne
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Totals Table */}
          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={{ color: '#64748b' }}>Sous-total Prestations:</Text>
              <Text style={{ fontWeight: 'bold' }}>{subtotal.toLocaleString()} DZD</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={{ color: '#64748b' }}>Remise ({invoice.discount_percent}%):</Text>
                <Text style={{ fontWeight: 'bold' }}>- {discountAmount.toLocaleString()} DZD</Text>
              </View>
            )}
            {taxAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={{ color: '#64748b' }}>TVA ({invoice.tax_percent}%):</Text>
                <Text style={{ fontWeight: 'bold' }}>+ {taxAmount.toLocaleString()} DZD</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text>TOTAL NET DZD :</Text>
              <Text>{totalAmount.toLocaleString()} DZD</Text>
            </View>
            <View style={[styles.totalsRow, { borderTopWidth: 0.5, borderTopColor: '#cbd5e1', paddingTop: 3, marginTop: 2 }]}>
              <Text style={{ color: '#059669', fontWeight: 'bold' }}>Déjà Encaissé :</Text>
              <Text style={{ color: '#059669', fontWeight: 'bold' }}>{amountPaid.toLocaleString()} DZD</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>SOLDE RESTANT :</Text>
              <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>{balanceDue.toLocaleString()} DZD</Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        {invoice.terms && (
          <View style={styles.termsBlock}>
            <Text style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' }}>CGV / Mentions Légales</Text>
            <Text style={[styles.regularText, { fontSize: 7, color: '#64748b' }]}>{invoice.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Facture émise par Travel Agency SaaS. Ce document numérique tient lieu de facture originale. Merci de votre confiance !
        </Text>
      </Page>
    </Document>
  )
}
