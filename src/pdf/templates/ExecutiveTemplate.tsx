import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { Quote, FontFamily } from '@/types/quote';
import { PDFItemsTable } from '../components/PDFItemsTable';
import { PDFFooter } from '../components/PDFFooter';
import { calculateTotals } from '@/lib/utils';
import { PDFLogo } from '../components/PDFLogo';

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

export const ExecutiveTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent = theme.accentColor ?? primary;
  const textColor = theme.textColor ?? '#1e293b';

  const { subtotal, vatTotals, total } = calculateTotals(quote.items);

  // ─── PAGE 1: EXECUTIVE SUMMARY ─────────────────────────────────────────────
  const p1 = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },

    // Dark sidebar (left 38%)
    sidebar: {
      position: 'absolute', top: 0, left: 0, bottom: 0, width: '38%',
      backgroundColor: textColor,
    },
    // Accent strip on sidebar top
    sidebarAccent: {
      position: 'absolute', top: 0, left: 0, width: '38%', height: 6,
      backgroundColor: primary,
    },
    // Subtle decorative line at bottom of sidebar
    sidebarBottomLine: {
      position: 'absolute', bottom: 0, left: 0, width: '38%', height: 2,
      backgroundColor: primary,
    },
    // Decorative dot grid pattern (subtle)
    sidebarDot: {
      position: 'absolute', top: 40, right: 20,
      width: 60, height: 60,
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 30,
    },

    // Main content area (right 62%)
    main: { marginLeft: '38%', padding: 44, flex: 1, flexDirection: 'column', justifyContent: 'space-between' },

    // Sidebar content
    sidebarContent: {
      width: '38%', position: 'absolute', top: 0, left: 0, bottom: 0,
      padding: 36, flexDirection: 'column', justifyContent: 'space-between',
    },
    logo: { width: 145, height: 70, objectFit: 'contain', marginBottom: 20, marginTop: 8 },
    sidebarName: { fontSize: 15, fontFamily: bold, color: '#ffffff', marginBottom: 10, lineHeight: 1.3 },
    sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 20 },
    sidebarSection: { marginBottom: 18 },
    sidebarLabel: {
      fontSize: 7.5, fontFamily: bold, color: primary,
      textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6,
    },
    sidebarText:  { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 3, lineHeight: 1.5 },

    // Summary totals in sidebar
    totalBox: {
      backgroundColor: primary, padding: 18,
      borderTopLeftRadius: 8, borderTopRightRadius: 8,
      borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    },
    totalEyebrow: {
      fontSize: 7.5, fontFamily: bold, color: 'rgba(255,255,255,0.6)',
      textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8,
    },
    totalValue: { fontSize: 26, fontFamily: bold, color: '#ffffff', lineHeight: 1, marginBottom: 4 },
    totalSub:   { fontSize: 8.5, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },

    // Main right side
    mainTop: {},
    mainTag: {
      fontSize: 9, fontFamily: bold, color: primary,
      textTransform: 'uppercase', letterSpacing: 3, marginBottom: 14,
    },
    mainTitle: { fontSize: 44, fontFamily: bold, color: textColor, lineHeight: 1.1, marginBottom: 4 },
    mainAccentBar: { width: 40, height: 4, backgroundColor: accent, marginBottom: 24, borderRadius: 2 },
    mainNum: { fontSize: 12, color: '#94a3b8', marginBottom: 4, letterSpacing: 0.5 },
    mainDate: { fontSize: 9.5, color: '#94a3b8' },

    clientCard: {
      backgroundColor: '#f8fafc', padding: 20,
      borderTopLeftRadius: 8, borderTopRightRadius: 8,
      borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
      borderLeftWidth: 3, borderLeftColor: primary,
    },
    clientLabel: {
      fontSize: 7.5, fontFamily: bold, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8,
    },
    clientName:  { fontSize: 17, fontFamily: bold, color: textColor, marginBottom: 5 },
    clientSub:   { fontSize: 9.5, color: '#64748b', marginBottom: 3, lineHeight: 1.4 },

    // Summary breakdown
    summaryBlock: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14 },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
    },
    summaryLabel: { fontSize: 9.5, color: '#64748b' },
    summaryValue: { fontSize: 9.5, fontFamily: bold, color: textColor },
  });

  // ─── PAGE 2: DETAIL ────────────────────────────────────────────────────────
  const p2 = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },
    topBar: { height: 6, backgroundColor: primary },
    inner: { padding: 40 },

    heading: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 24, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    headingTitle: { fontSize: 18, fontFamily: bold, color: textColor },
    headingSub:   { fontSize: 9, color: '#94a3b8', marginTop: 3 },
    headingRight: { alignItems: 'flex-end' },
    headingNum:   { fontSize: 11, fontFamily: bold, color: primary },
    headingDate:  { fontSize: 9, color: '#94a3b8', marginTop: 3 },

    signatureBlock: { marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end', gap: 48 },
    signatureBox: { alignItems: 'center', width: 160 },
    signatureLine: { width: '100%', height: 1, backgroundColor: '#cbd5e1', marginBottom: 8 },
    signatureLabel: { fontSize: 8.5, color: '#94a3b8', letterSpacing: 0.5 },
  });

  return (
    <Document>
      {/* ── PAGE 1: EXECUTIVE SUMMARY ── */}
      <Page size="A4" style={p1.page}>
        {/* Sidebar backgrounds */}
        <View style={p1.sidebar} />
        <View style={p1.sidebarAccent} />
        <View style={p1.sidebarBottomLine} />
        <View style={p1.sidebarDot} />

        {/* Sidebar content */}
        <View style={p1.sidebarContent}>
          <View>
            {sender.logo ? <PDFLogo src={sender.logo} theme={theme} baseWidth={145} baseHeight={70} /> : null}
            <Text style={p1.sidebarName}>{sender.name || 'Nome Azienda'}</Text>
            <View style={p1.sidebarDivider} />

            {sender.address ? (
              <View style={p1.sidebarSection}>
                <Text style={p1.sidebarLabel}>Indirizzo</Text>
                <Text style={p1.sidebarText}>{sender.address}</Text>
                {(sender.city || sender.postalCode) ? (
                  <Text style={p1.sidebarText}>{sender.postalCode} {sender.city}</Text>
                ) : null}
              </View>
            ) : null}

            {sender.vatNumber ? (
              <View style={p1.sidebarSection}>
                <Text style={p1.sidebarLabel}>P.IVA / C.F.</Text>
                <Text style={p1.sidebarText}>{sender.vatNumber}</Text>
              </View>
            ) : null}

            {(sender.email || sender.phone) ? (
              <View style={p1.sidebarSection}>
                <Text style={p1.sidebarLabel}>Contatti</Text>
                {sender.email ? <Text style={p1.sidebarText}>{sender.email}</Text> : null}
                {sender.phone ? <Text style={p1.sidebarText}>{sender.phone}</Text> : null}
              </View>
            ) : null}
          </View>

          {/* Total summary box */}
          <View style={p1.totalBox}>
            <Text style={p1.totalEyebrow}>Totale Preventivo</Text>
            <Text style={p1.totalValue}>{fmt(total, quote.currency)}</Text>
            <Text style={p1.totalSub}>IVA inclusa · Valido {quote.validityDays} giorni</Text>
          </View>
        </View>

        {/* Main right content */}
        <View style={p1.main}>
          <View style={p1.mainTop}>
            <Text style={p1.mainTag}>Offerta Commerciale</Text>
            <Text style={p1.mainTitle}>Preventivo.</Text>
            <View style={p1.mainAccentBar} />
            <Text style={p1.mainNum}>N° {quote.number}</Text>
            <Text style={p1.mainDate}>{formatDate(quote.createdAt)}</Text>
          </View>

          {/* Client card + financial summary */}
          <View>
            <View style={p1.clientCard}>
              <Text style={p1.clientLabel}>Preparato per</Text>
              <Text style={p1.clientName}>{client.name || 'Cliente'}</Text>
              {client.address ? <Text style={p1.clientSub}>{client.address}</Text> : null}
              {(client.city || client.postalCode) ? (
                <Text style={p1.clientSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
              ) : null}
              {client.vatNumber ? <Text style={p1.clientSub}>P.IVA {client.vatNumber}</Text> : null}
              {client.email ? <Text style={p1.clientSub}>{client.email}</Text> : null}
            </View>

            {/* Financial summary */}
            <View style={p1.summaryBlock}>
              <View style={p1.summaryRow}>
                <Text style={p1.summaryLabel}>Imponibile</Text>
                <Text style={p1.summaryValue}>{fmt(subtotal, quote.currency)}</Text>
              </View>
              {Object.entries(vatTotals).map(([rate, amount]) => {
                if ((amount as number) <= 0) return null;
                return (
                  <View key={rate} style={p1.summaryRow}>
                    <Text style={p1.summaryLabel}>IVA {rate}%</Text>
                    <Text style={p1.summaryValue}>{fmt(amount as number, quote.currency)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Page>

      {/* ── PAGE 2: DETAIL ── */}
      <Page size="A4" style={p2.page}>
        <View style={p2.topBar} fixed />
        <View style={p2.inner}>
          <View style={p2.heading}>
            <View>
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

          {/* Signature blocks */}
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
