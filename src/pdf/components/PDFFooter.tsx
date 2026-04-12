import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { Quote, FontFamily } from '@/types/quote';
import { calculateTotals } from '@/lib/utils';

function boldFont(family: FontFamily): string {
  if (family === 'Times-Roman') return 'Times-Bold';
  if (family === 'Courier') return 'Courier-Bold';
  return 'Helvetica-Bold';
}

export const PDFFooter = ({ quote }: { quote: Quote }) => {
  const { subtotal, vatTotals, total } = calculateTotals(quote.items);
  const { theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';

  const showNotes = theme.showFooterNotes !== false;
  const showPayment = theme.showPaymentTerms !== false;

  const styles = StyleSheet.create({
    container: {
      marginTop: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    notesBlock: {
      width: '52%',
      paddingRight: 24,
    },
    notesTitle: {
      fontSize: 9,
      fontFamily: bold,
      color: primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    notesText: {
      fontSize: 8.5,
      fontFamily: font,
      color: '#475569',
      lineHeight: 1.5,
      marginBottom: 12,
    },
    totalsBlock: {
      width: '48%',
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    totalsLabel: {
      fontSize: 9.5,
      fontFamily: font,
      color: '#64748b',
    },
    totalsValue: {
      fontSize: 9.5,
      fontFamily: bold,
      color: '#1e293b',
    },
    finalTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: primary,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      marginTop: 10,
    },
    finalTotalLabel: {
      fontSize: 11,
      fontFamily: bold,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    finalTotalValue: {
      fontSize: 13,
      fontFamily: bold,
      color: '#ffffff',
    },
  });

  const symbol = quote.currency === 'USD' ? '$' : quote.currency === 'GBP' ? '£' : quote.currency === 'CHF' ? 'CHF' : '€';
  const fmt = (cents: number) => `${symbol} ${(cents / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const signatureStyles = StyleSheet.create({
    signatureSection: {
      marginTop: 36,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 24,
    },
    signatureBox: {
      flex: 1,
      borderTopWidth: 1,
      borderTopColor: '#cbd5e1',
      paddingTop: 10,
    },
    signatureLabel: {
      fontSize: 8,
      fontFamily: bold,
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 40,
    },
    signatureLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
      marginBottom: 6,
    },
    signatureSubLabel: {
      fontSize: 7.5,
      fontFamily: font,
      color: '#94a3b8',
    },
    // Acceptance stamp
    stampContainer: {
      marginTop: 12,
      alignSelf: 'flex-end' as const,
      borderWidth: 2,
      borderColor: '#22c55e',
      backgroundColor: '#f0fdf4',
      padding: 8,
      width: 170,
    },
    stampTitle: {
      fontSize: 14,
      fontFamily: bold,
      color: '#16a34a',
      marginBottom: 4,
    },
    stampName: {
      fontSize: 9,
      fontFamily: bold,
      color: '#15803d',
      marginBottom: 2,
    },
    stampDate: {
      fontSize: 8,
      fontFamily: font,
      color: '#4ade80',
    },
    signatureImage: {
      width: 150,
      height: 55,
      objectFit: 'contain' as const,
      marginBottom: 4,
    },
  });

  return (
    <>
    <View style={styles.container}>
      {/* Notes and payment terms */}
      <View style={styles.notesBlock}>
        {showPayment && quote.paymentTerms && (
          <>
            <Text style={styles.notesTitle}>Termini di Pagamento</Text>
            <Text style={styles.notesText}>{quote.paymentTerms}</Text>
          </>
        )}
        {quote.iban && (
          <>
            <Text style={styles.notesTitle}>IBAN</Text>
            <Text style={styles.notesText}>{quote.iban}</Text>
          </>
        )}
        {showNotes && quote.notes && (
          <>
            <Text style={styles.notesTitle}>Note e Condizioni</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </>
        )}
      </View>

      {/* Totals */}
      <View style={styles.totalsBlock}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Totale Imponibile</Text>
          <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
        </View>
        {Object.entries(vatTotals).map(([rate, amount]) => {
          if ((amount as number) <= 0) return null;
          return (
            <View key={rate} style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>IVA {rate}%</Text>
              <Text style={styles.totalsValue}>{fmt(amount as number)}</Text>
            </View>
          );
        })}
        <View style={styles.finalTotalRow}>
          <Text style={styles.finalTotalLabel}>Totale</Text>
          <Text style={styles.finalTotalValue}>{fmt(total)}</Text>
        </View>
      </View>
    </View>

    {/* Signature + stamp block — wrap={false} keeps it on the same page */}
    <View wrap={false}>
      <View style={signatureStyles.signatureSection}>
        <View style={signatureStyles.signatureBox}>
          <Text style={signatureStyles.signatureLabel}>Timbro e Firma Fornitore</Text>
          <View style={signatureStyles.signatureLine} />
          <Text style={signatureStyles.signatureSubLabel}>Data: _______________</Text>
        </View>
        <View style={signatureStyles.signatureBox}>
          <Text style={signatureStyles.signatureLabel}>Timbro e Firma Cliente</Text>
          {/* Firma autografa digitale */}
          {quote.acceptanceStamp?.signatureImage && (
            <Image
              src={quote.acceptanceStamp.signatureImage}
              style={signatureStyles.signatureImage}
            />
          )}
          <View style={signatureStyles.signatureLine} />
          <Text style={signatureStyles.signatureSubLabel}>Data: _______________</Text>
        </View>
      </View>

      {/* Acceptance stamp */}
      {quote.acceptanceStamp && (
        <View style={signatureStyles.stampContainer}>
          <Text style={signatureStyles.stampTitle}>ACCETTATO</Text>
          <Text style={signatureStyles.stampName}>{quote.acceptanceStamp.clientName.substring(0, 24)}</Text>
          <Text style={signatureStyles.stampDate}>
            {new Date(quote.acceptanceStamp.acceptedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
            {new Date(quote.acceptanceStamp.acceptedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}
    </View>
    </>
  );
};
