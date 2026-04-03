import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { Quote, FontFamily } from '@/types/quote';
import { PDFItemsTable } from '../components/PDFItemsTable';
import { PDFFooter } from '../components/PDFFooter';
import { PDFLogo } from '../components/PDFLogo';
import { calculateTotals } from '@/lib/utils';

function boldFont(family: FontFamily): string {
  if (family === 'Times-Roman') return 'Times-Bold';
  if (family === 'Courier') return 'Courier-Bold';
  return 'Helvetica-Bold';
}

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return d; }
};

const fmt = (cents: number, currency: string) => {
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'CHF' ? 'CHF ' : '€ ';
  return `${symbol}${(cents / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`;
};

// ─── Executive Template (PRO) ────────────────────────────────────────────────
// Pagina 1: Executive Summary
//   - Header elegante con logo + titolo preventivo
//   - Due colonne: informazioni mittente | informazioni cliente
//   - Riepilogo finanziario in un box premium con breakdown IVA
//   - Validità e note nella colonna destra
//
// Pagina 2: Dettaglio voci
//   - Header ridotto con logo e numero
//   - Tabella completa + footer con totali
//   - Blocco firme
// ─────────────────────────────────────────────────────────────────────────────

export const ExecutiveTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary  = theme.primaryColor ?? '#1e293b';
  const accent   = theme.accentColor  ?? '#5c32e6';
  const textColor = theme.textColor   ?? '#1e293b';

  const { subtotal, vatTotals, total } = calculateTotals(quote.items);

  // ─── PAGINA 1: EXECUTIVE SUMMARY ──────────────────────────────────────────
  const p1 = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font, padding: 44 },

    // Header
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 28,
      paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: primary,
    },
    logoBlock: { flexDirection: 'column' },
    senderName: { fontSize: 13, fontFamily: bold, color: textColor, marginBottom: 4, marginTop: 6 },
    senderSub:  { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    // Blocco titolo a destra
    titleBlock: { alignItems: 'flex-end' },
    titleEyebrow: {
      fontSize: 8, fontFamily: bold, color: accent,
      textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6,
    },
    titleMain: { fontSize: 30, fontFamily: bold, color: primary, lineHeight: 1, marginBottom: 6 },
    titleAccent: { width: 40, height: 3, backgroundColor: accent, marginBottom: 6, borderRadius: 2, alignSelf: 'flex-end' },
    titleNum: { fontSize: 12, fontFamily: bold, color: accent, marginBottom: 2 },
    titleDate: { fontSize: 8.5, color: '#94a3b8' },

    // Due colonne: mittente | cliente
    twoCol: { flexDirection: 'row', gap: 0, marginBottom: 24 },
    col1: { width: '48%' },
    col2: { width: '48%', marginLeft: '4%' },

    colHeader: {
      fontSize: 7.5, fontFamily: bold, color: accent,
      textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10,
      borderBottomWidth: 1.5, borderBottomColor: accent, paddingBottom: 5,
    },
    colName: { fontSize: 12, fontFamily: bold, color: textColor, marginBottom: 4, marginTop: 6 },
    colSub:  { fontSize: 8.5, color: '#64748b', marginBottom: 2.5, lineHeight: 1.4 },

    // Riepilogo finanziario
    financeBox: {
      backgroundColor: primary, padding: 24,
      borderTopLeftRadius: 8, borderTopRightRadius: 8,
      borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
      marginBottom: 20,
    },
    financeTitle: {
      fontSize: 8, fontFamily: bold, color: 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
    },
    financeRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    financeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)' },
    financeValue: { fontSize: 9, fontFamily: bold, color: '#ffffff' },
    financeTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
    financeTotalLabel: { fontSize: 10, fontFamily: bold, color: 'rgba(255,255,255,0.75)' },
    financeTotalValue: { fontSize: 22, fontFamily: bold, color: '#ffffff' },

    // Box validità
    validityBox: {
      backgroundColor: '#f8fafc', padding: 16,
      borderTopLeftRadius: 6, borderTopRightRadius: 6,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
      borderLeftWidth: 3, borderLeftColor: accent,
    },
    validityLabel: { fontSize: 7.5, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
    validityValue: { fontSize: 11, fontFamily: bold, color: textColor },
    validitySub:   { fontSize: 8.5, color: '#64748b', marginTop: 3 },
  });

  // ─── PAGINA 2: DETTAGLIO ──────────────────────────────────────────────────
  const p2 = StyleSheet.create({
    page:    { backgroundColor: '#ffffff', fontFamily: font },
    topBar:  { height: 5, backgroundColor: primary },
    accentBar: { height: 2, backgroundColor: accent },
    inner:   { padding: 44 },

    heading: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 24, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    headingLeft: {},
    headingTitle: { fontSize: 18, fontFamily: bold, color: textColor },
    headingSub:   { fontSize: 9, color: '#94a3b8', marginTop: 3 },
    headingRight: { alignItems: 'flex-end' },
    headingNum:   { fontSize: 11, fontFamily: bold, color: accent },
    headingDate:  { fontSize: 9, color: '#94a3b8', marginTop: 3 },

    signatureBlock: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    signatureBox:   { alignItems: 'center', width: '45%' },
    signatureLine:  { width: '100%', height: 1, backgroundColor: '#cbd5e1', marginBottom: 8 },
    signatureLabel: { fontSize: 8.5, color: '#94a3b8', letterSpacing: 0.5 },
  });

  const logoEl = sender.logo
    ? <PDFLogo src={sender.logo} theme={theme} baseWidth={160} baseHeight={58} />
    : null;

  return (
    <Document>
      {/* ── PAGINA 1: EXECUTIVE SUMMARY ── */}
      <Page size="A4" style={p1.page}>
        {/* Header */}
        <View style={p1.header}>
          <View style={p1.logoBlock}>
            {logoEl}
            {!sender.logo && <Text style={p1.senderName}>{sender.name || 'Nome Azienda'}</Text>}
            {sender.logo && sender.name && <Text style={p1.senderName}>{sender.name}</Text>}
            {sender.vatNumber && <Text style={p1.senderSub}>P.IVA {sender.vatNumber}</Text>}
            {sender.email && <Text style={p1.senderSub}>{sender.email}</Text>}
            {sender.phone && <Text style={p1.senderSub}>{sender.phone}</Text>}
          </View>
          <View style={p1.titleBlock}>
            <Text style={p1.titleEyebrow}>Offerta Commerciale</Text>
            <Text style={p1.titleMain}>Preventivo.</Text>
            <View style={p1.titleAccent} />
            <Text style={p1.titleNum}>N° {quote.number}</Text>
            <Text style={p1.titleDate}>{formatDate(quote.createdAt)}</Text>
          </View>
        </View>

        {/* Due colonne: mittente | cliente */}
        <View style={p1.twoCol}>
          <View style={p1.col1}>
            <Text style={p1.colHeader}>Emesso da</Text>
            <Text style={p1.colName}>{sender.name || 'Nome Azienda'}</Text>
            {sender.address && <Text style={p1.colSub}>{sender.address}</Text>}
            {(sender.city || sender.postalCode) && (
              <Text style={p1.colSub}>{sender.postalCode} {sender.city}</Text>
            )}
            {sender.vatNumber && <Text style={p1.colSub}>P.IVA {sender.vatNumber}</Text>}
            {sender.email && <Text style={p1.colSub}>{sender.email}</Text>}
            {sender.phone && <Text style={p1.colSub}>{sender.phone}</Text>}
            {sender.customFields?.map(f => <Text key={f.id} style={p1.colSub}>{f.label}: {f.value}</Text>)}
          </View>
          <View style={p1.col2}>
            <Text style={p1.colHeader}>Destinatario</Text>
            <Text style={p1.colName}>{client.name || 'Cliente'}</Text>
            {client.address && <Text style={p1.colSub}>{client.address}</Text>}
            {(client.city || client.postalCode) && (
              <Text style={p1.colSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
            )}
            {client.vatNumber && <Text style={p1.colSub}>P.IVA {client.vatNumber}</Text>}
            {client.email && <Text style={p1.colSub}>{client.email}</Text>}
            {client.customFields?.map(f => <Text key={f.id} style={p1.colSub}>{f.label}: {f.value}</Text>)}
          </View>
        </View>

        {/* Riepilogo finanziario */}
        <View style={p1.financeBox}>
          <Text style={p1.financeTitle}>Riepilogo Economico</Text>
          <View style={p1.financeRow}>
            <Text style={p1.financeLabel}>Imponibile netto</Text>
            <Text style={p1.financeValue}>{fmt(subtotal, quote.currency)}</Text>
          </View>
          {Object.entries(vatTotals).map(([rate, amount]) => {
            if ((amount as number) <= 0) return null;
            return (
              <View key={rate} style={p1.financeRow}>
                <Text style={p1.financeLabel}>IVA {rate}%</Text>
                <Text style={p1.financeValue}>{fmt(amount as number, quote.currency)}</Text>
              </View>
            );
          })}
          <View style={p1.financeTotalRow}>
            <Text style={p1.financeTotalLabel}>TOTALE</Text>
            <Text style={p1.financeTotalValue}>{fmt(total, quote.currency)}</Text>
          </View>
        </View>

        {/* Box validità */}
        <View style={p1.validityBox}>
          <Text style={p1.validityLabel}>Validità Offerta</Text>
          <Text style={p1.validityValue}>{quote.validityDays} giorni dalla data di emissione</Text>
          <Text style={p1.validitySub}>Scadenza: {(() => {
            try {
              const d = new Date(quote.createdAt);
              d.setDate(d.getDate() + (quote.validityDays ?? 30));
              return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
            } catch { return '—'; }
          })()}</Text>
        </View>
      </Page>

      {/* ── PAGINA 2: DETTAGLIO VOCI ── */}
      <Page size="A4" style={p2.page}>
        <View style={p2.topBar} fixed />
        <View style={p2.accentBar} fixed />
        <View style={p2.inner}>
          <View style={p2.heading}>
            <View style={p2.headingLeft}>
              <Text style={p2.headingTitle}>Dettaglio Voci</Text>
              <Text style={p2.headingSub}>{sender.name} → {client.name}</Text>
            </View>
            <View style={p2.headingRight}>
              <Text style={p2.headingNum}>#{quote.number}</Text>
              <Text style={p2.headingDate}>{formatDate(quote.createdAt)}</Text>
            </View>
          </View>

          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />

          {/* Firme */}
          <View style={p2.signatureBlock}>
            <View style={p2.signatureBox}>
              <View style={p2.signatureLine} />
              <Text style={p2.signatureLabel}>Firma Mittente</Text>
            </View>
            <View style={p2.signatureBox}>
              <View style={p2.signatureLine} />
              <Text style={p2.signatureLabel}>Firma per Accettazione</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
