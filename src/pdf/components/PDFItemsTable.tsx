import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { Quote, FontFamily } from '@/types/quote';

function boldFont(family: FontFamily): string {
  if (family === 'Times-Roman') return 'Times-Bold';
  if (family === 'Courier') return 'Courier-Bold';
  return 'Helvetica-Bold';
}

export const PDFItemsTable = ({ quote }: { quote: Quote }) => {
  const { items, theme, currency, itemCustomColumns } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const tableStyle = theme.tableStyle ?? 'striped';
  const primary = theme.primaryColor ?? '#5c32e6';

  // Compute widths dynamically based on number of custom columns
  // Fixed columns take ~56%, leaving ~44% for desc + customs
  const customCount = (itemCustomColumns || []).length;
  // Each custom column gets 14%, desc gets what remains (min 14%)
  const customPct = 14;
  const descPct = Math.max(14, 44 - customCount * customPct);

  const styles = StyleSheet.create({
    tableContainer: { flexDirection: 'column', marginTop: 20 },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: primary,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    headerText: {
      color: '#ffffff',
      fontSize: customCount > 0 ? 7.5 : 9,
      fontFamily: bold,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: tableStyle === 'minimal' || tableStyle === 'bordered' ? 1 : 0,
      borderBottomColor: '#e2e8f0',
      paddingVertical: 9,
      paddingHorizontal: 10,
      alignItems: 'center',
      minHeight: 32,
    },
    tableRowEven: {
      backgroundColor: tableStyle === 'striped' ? '#f8fafc' : 'transparent',
    },
    rowText: { fontSize: 9.5, fontFamily: font, color: '#334155' },
    // Fixed columns (static widths that sum to ~56% leaving ~44% for desc + customs)
    colQty:   { width: '7%',  textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colDisc:  { width: '7%',  textAlign: 'right' },
    colVat:   { width: '7%',  textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right', fontFamily: bold },
  });

  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'CHF' ? 'CHF' : '€';
  const fmt = (cents: number) => `${symbol} ${(cents / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const colDesc = { width: `${descPct}%` };
  const colCustom = { width: `${customPct}%`, textAlign: 'left' as const };

  return (
    <View style={styles.tableContainer}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, colDesc]}>Descrizione</Text>
        {(itemCustomColumns || []).map(col => (
          <Text key={col.id} style={[styles.headerText, colCustom]}>{col.label}</Text>
        ))}
        <Text style={[styles.headerText, styles.colQty]}>Qtà</Text>
        <Text style={[styles.headerText, styles.colPrice]}>Prezzo</Text>
        <Text style={[styles.headerText, styles.colDisc]}>Sc.</Text>
        <Text style={[styles.headerText, styles.colVat]}>IVA</Text>
        <Text style={[styles.headerText, styles.colTotal]}>Totale</Text>
      </View>

      {/* Rows */}
      {items.length === 0 ? (
        <View style={styles.tableRow}>
          <Text style={[styles.rowText, { width: '100%', textAlign: 'center', color: '#94a3b8' }]}>
            Nessuna voce presente
          </Text>
        </View>
      ) : (
        items.map((item, i) => {
          const lineBase = item.unitPrice * item.quantity;
          const discountVal = item.discountType === 'fixed'
            ? (item.discount || 0)
            : lineBase * ((item.discount || 0) / 100);
          const lineSubtotal = Math.max(0, lineBase - discountVal);
          const isEven = i % 2 !== 0;

          return (
            <View key={item.id} style={[styles.tableRow, isEven ? styles.tableRowEven : {}]}>
              <Text style={[styles.rowText, colDesc]}>{item.description || '-'}</Text>
              {(itemCustomColumns || []).map(col => (
                <Text key={col.id} style={[styles.rowText, colCustom]}>
                  {item.customFields?.[col.id] || '-'}
                </Text>
              ))}
              <Text style={[styles.rowText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.rowText, styles.colPrice]}>{fmt(item.unitPrice)}</Text>
              <Text style={[styles.rowText, styles.colDisc]}>
                {item.discount > 0
                  ? item.discountType === 'fixed' ? fmt(item.discount) : `${item.discount}%`
                  : '—'}
              </Text>
              <Text style={[styles.rowText, styles.colVat]}>{item.vatRate}%</Text>
              <Text style={[styles.rowText, styles.colTotal]}>{fmt(Math.round(lineSubtotal))}</Text>
            </View>
          );
        })
      )}
    </View>
  );
};
