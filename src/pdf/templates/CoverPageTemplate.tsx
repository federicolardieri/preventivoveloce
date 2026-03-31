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

export const CoverPageTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent  = theme.accentColor  ?? '#1d4ed8';
  const textColor = theme.textColor  ?? '#1e293b';

  const { total } = calculateTotals(quote.items);

  // ─── COVER PAGE ────────────────────────────────────────────────────────────
  const cover = StyleSheet.create({
    page: { backgroundColor: primary, fontFamily: font },

    // Decorative panels
    decorRight: {
      position: 'absolute', top: 0, right: 0,
      width: '35%', height: '100%',
      backgroundColor: 'rgba(255,255,255,0.07)',
    },
    decorBottomStrip: {
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
      backgroundColor: accent,
    },
    decorTopLine: {
      position: 'absolute', top: 56, left: 56, right: 56, height: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },

    inner: { flex: 1, padding: 56, flexDirection: 'column', justifyContent: 'space-between' },

    // ── TOP: identity ──
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingBottom: 28 },
    logo: { width: 220, height: 80, objectFit: 'contain' },
    senderBlock: { flexDirection: 'column' },
    senderName: { fontSize: 18, fontFamily: bold, color: '#ffffff', marginBottom: 4, lineHeight: 1.2 },
    senderSub:  { fontSize: 9.5, color: 'rgba(255,255,255,0.6)', marginBottom: 2, lineHeight: 1.4 },

    // ── CENTER: title ──
    centerBlock: { flexDirection: 'column' },
    eyebrow: {
      fontSize: 10, fontFamily: bold, color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase', letterSpacing: 4, marginBottom: 16,
    },
    mainTitle: { fontSize: 64, fontFamily: bold, color: '#ffffff', lineHeight: 1.1, marginBottom: 20 },
    dividerAccent: { width: 60, height: 4, backgroundColor: accent, marginBottom: 20, borderRadius: 2 },
    numRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    numLabel: { fontSize: 10, fontFamily: bold, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 },
    numValue: { fontSize: 18, fontFamily: bold, color: '#ffffff' },

    // ── BOTTOM: client + totale ──
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },

    clientCard: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderLeftWidth: 3, borderLeftColor: accent,
      padding: 18,
      maxWidth: '55%',
    },
    clientEyebrow: { fontSize: 8, fontFamily: bold, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    clientName:    { fontSize: 20, fontFamily: bold, color: '#ffffff', marginBottom: 5, lineHeight: 1.2 },
    clientSub:     { fontSize: 9.5, color: 'rgba(255,255,255,0.65)', marginBottom: 2.5, lineHeight: 1.4 },

    metaCard: { alignItems: 'flex-end', gap: 4 },
    metaRow:  { alignItems: 'flex-end' },
    metaLabel: { fontSize: 8, fontFamily: bold, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 },
    metaValue: { fontSize: 13, fontFamily: bold, color: 'rgba(255,255,255,0.9)' },
    totalBig:  { fontSize: 28, fontFamily: bold, color: '#ffffff' },
  });

  // ─── CONTENT PAGE ──────────────────────────────────────────────────────────
  const ct = StyleSheet.create({
    page:     { backgroundColor: '#ffffff', fontFamily: font },
    topBar:   { height: 5, backgroundColor: primary },
    inner:    { padding: 44 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    logo:   { width: 180, height: 65, objectFit: 'contain', marginBottom: 8 },
    senderName: { fontSize: 13, fontFamily: bold, color: textColor, marginBottom: 4 },
    subText:    { fontSize: 9, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    clientGroup: { alignItems: 'flex-end' },
    clientTag:   { fontSize: 8, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    clientName:  { fontSize: 13, fontFamily: bold, color: textColor, marginBottom: 3 },

    // Meta strip
    metaStrip: {
      flexDirection: 'row', gap: 0, marginBottom: 28,
      backgroundColor: primary,
      borderRadius: 8,
      overflow: 'hidden',
    },
    metaItem: { flex: 1, padding: 16 },
    metaItemBorder: { flex: 1, padding: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' },
    metaLabel: { fontSize: 7.5, fontFamily: bold, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
    metaValue: { fontSize: 12, fontFamily: bold, color: '#ffffff' },
  });

  return (
    <Document>
      {/* ─── PAGE 1: COVER ─── */}
      <Page size="A4" style={cover.page}>
        {/* Decorative elements */}
        <View style={cover.decorRight} />
        <View style={cover.decorBottomStrip} />
        <View style={cover.decorTopLine} />

        <View style={cover.inner}>
          {/* TOP: company identity */}
          <View style={cover.topRow}>
            {sender.logo ? <PDFLogo src={sender.logo} theme={theme} baseWidth={220} baseHeight={80} /> : null}
            <View style={cover.senderBlock}>
              <Text style={cover.senderName}>{sender.name || 'Nome Azienda'}</Text>
              {sender.vatNumber ? <Text style={cover.senderSub}>P.IVA {sender.vatNumber}</Text> : null}
              {sender.email ? <Text style={cover.senderSub}>{sender.email}</Text> : null}
              {sender.phone ? <Text style={cover.senderSub}>{sender.phone}</Text> : null}
            </View>
          </View>

          {/* CENTER: big title — no word breaks */}
          <View style={cover.centerBlock}>
            <Text style={cover.eyebrow}>Documento Commerciale</Text>
            <Text style={cover.mainTitle}>Preventivo.</Text>
            <View style={cover.dividerAccent} />
            <View style={cover.numRow}>
              <Text style={cover.numLabel}>N°</Text>
              <Text style={cover.numValue}>{quote.number}</Text>
              <Text style={[cover.numLabel, { marginLeft: 24 }]}>Emesso il</Text>
              <Text style={cover.numValue}>{formatDate(quote.createdAt)}</Text>
            </View>
          </View>

          {/* BOTTOM: client + meta */}
          <View style={cover.bottomRow}>
            <View style={cover.clientCard}>
              <Text style={cover.clientEyebrow}>Preparato per</Text>
              <Text style={cover.clientName}>{client.name || 'Cliente'}</Text>
              {client.address ? <Text style={cover.clientSub}>{client.address}</Text> : null}
              {(client.city || client.postalCode) ? (
                <Text style={cover.clientSub}>{client.postalCode} {client.city}</Text>
              ) : null}
              {client.vatNumber ? <Text style={cover.clientSub}>P.IVA {client.vatNumber}</Text> : null}
              {client.email ? <Text style={cover.clientSub}>{client.email}</Text> : null}
            </View>

            <View style={cover.metaCard}>
              <View style={cover.metaRow}>
                <Text style={cover.metaLabel}>Validità</Text>
                <Text style={cover.metaValue}>{quote.validityDays} giorni</Text>
              </View>
              {total > 0 && (
                <View style={[cover.metaRow, { marginTop: 12 }]}>
                  <Text style={cover.metaLabel}>Importo Totale</Text>
                  <Text style={cover.totalBig}>{fmt(total, quote.currency)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>

      {/* ─── PAGE 2: CONTENT ─── */}
      <Page size="A4" style={ct.page}>
        <View style={ct.topBar} fixed />
        <View style={ct.inner}>
          {/* Header */}
          <View style={ct.header}>
            <View>
              {sender.logo
                ? <PDFLogo src={sender.logo} theme={theme} baseWidth={180} baseHeight={65} />
                : <Text style={ct.senderName}>{sender.name || 'Nome Azienda'}</Text>}
              {sender.logo && sender.name ? <Text style={ct.senderName}>{sender.name}</Text> : null}
              {sender.address ? <Text style={ct.subText}>{sender.address}</Text> : null}
              {(sender.city || sender.postalCode) ? (
                <Text style={ct.subText}>{sender.postalCode} {sender.city}</Text>
              ) : null}
              {sender.vatNumber ? <Text style={ct.subText}>P.IVA {sender.vatNumber}</Text> : null}
              {sender.email ? <Text style={ct.subText}>{sender.email}</Text> : null}
            </View>
            <View style={ct.clientGroup}>
              <Text style={ct.clientTag}>Spettabile</Text>
              <Text style={ct.clientName}>{client.name || 'Cliente'}</Text>
              {client.address ? <Text style={ct.subText}>{client.address}</Text> : null}
              {(client.city || client.postalCode) ? (
                <Text style={ct.subText}>{client.postalCode} {client.city}</Text>
              ) : null}
              {client.vatNumber ? <Text style={ct.subText}>P.IVA {client.vatNumber}</Text> : null}
            </View>
          </View>

          {/* Meta strip — colored */}
          <View style={ct.metaStrip}>
            <View style={ct.metaItem}>
              <Text style={ct.metaLabel}>Numero Preventivo</Text>
              <Text style={ct.metaValue}>#{quote.number}</Text>
            </View>
            <View style={ct.metaItemBorder}>
              <Text style={ct.metaLabel}>Data Emissione</Text>
              <Text style={ct.metaValue}>{formatDate(quote.createdAt)}</Text>
            </View>
            <View style={ct.metaItemBorder}>
              <Text style={ct.metaLabel}>Validità Offerta</Text>
              <Text style={ct.metaValue}>{quote.validityDays} giorni</Text>
            </View>
          </View>

          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
