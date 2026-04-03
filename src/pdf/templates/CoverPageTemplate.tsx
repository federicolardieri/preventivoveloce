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

// ─── Cover Page Template (PRO) ───────────────────────────────────────────────
// Pagina 1: Cover full-color premium
//   - Background primary con overlay geometrico
//   - Logo grande + nome azienda in cima
//   - Titolo centrale gigante "Preventivo."
//   - Numero + data con accent bar
//   - Box cliente in basso a sinistra, importo totale a destra
//
// Pagina 2: Contenuto
//   - Header leggero con logo + mittente e cliente
//   - Meta strip colorata
//   - Tabella voci + footer
// ─────────────────────────────────────────────────────────────────────────────

export const CoverPageTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary  = theme.primaryColor ?? '#0f172a';
  const accent   = theme.accentColor  ?? '#f97316';
  const textColor = theme.textColor   ?? '#1e293b';

  const { total } = calculateTotals(quote.items);

  // ─── PAGINA 1: COVER ──────────────────────────────────────────────────────
  const cv = StyleSheet.create({
    page: { backgroundColor: primary, fontFamily: font },

    // Pannelli geometrici decorativi (no gradient, solo geometry)
    geomTopRight: {
      position: 'absolute', top: 0, right: 0,
      width: '42%', height: '55%',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    geomBottomLeft: {
      position: 'absolute', bottom: 0, left: 0,
      width: '30%', height: '30%',
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    geomAccentRight: {
      position: 'absolute', top: 0, right: 0,
      width: '42%', height: 6,
      backgroundColor: accent,
    },
    geomAccentBottom: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 6, backgroundColor: accent,
    },

    inner: { flex: 1, paddingHorizontal: 52, paddingVertical: 48, flexDirection: 'column', justifyContent: 'space-between' },

    // ── TOP: identità azienda ──
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    senderBlock: {},
    senderName: { fontSize: 16, fontFamily: bold, color: '#ffffff', lineHeight: 1.2 },
    senderSub:  { fontSize: 8.5, color: 'rgba(255,255,255,0.5)', marginTop: 3, lineHeight: 1.4 },

    // ── CENTER: titolo ──
    centerBlock: {},
    eyebrow: {
      fontSize: 9, fontFamily: bold, color: accent,
      textTransform: 'uppercase', letterSpacing: 5, marginBottom: 18,
    },
    mainTitle: { fontSize: 72, fontFamily: bold, color: '#ffffff', lineHeight: 1, letterSpacing: -2, marginBottom: 20 },
    accentBar: { width: 64, height: 5, backgroundColor: accent, marginBottom: 24, borderRadius: 3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 32 },
    metaBlock: {},
    metaLabel: { fontSize: 7.5, fontFamily: bold, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    metaValue: { fontSize: 15, fontFamily: bold, color: '#ffffff' },

    // ── BOTTOM: cliente + totale ──
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },

    clientCard: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderLeftWidth: 3, borderLeftColor: accent,
      padding: 18, maxWidth: '55%',
    },
    clientEyebrow: { fontSize: 7.5, fontFamily: bold, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
    clientName:    { fontSize: 22, fontFamily: bold, color: '#ffffff', marginBottom: 6, lineHeight: 1.2 },
    clientSub:     { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 2.5, lineHeight: 1.4 },

    totalBlock: { alignItems: 'flex-end' },
    totalLabel: { fontSize: 7.5, fontFamily: bold, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
    totalValue: { fontSize: 32, fontFamily: bold, color: '#ffffff', lineHeight: 1 },
    totalSub:   { fontSize: 8.5, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  });

  // ─── PAGINA 2: CONTENUTO ──────────────────────────────────────────────────
  const pg = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },

    // Barra colorata in cima
    topBar: { height: 5, backgroundColor: primary },
    accentBar: { height: 2, backgroundColor: accent },

    inner: { padding: 44 },

    // Header
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 24,
      paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    senderName: { fontSize: 12, fontFamily: bold, color: textColor, marginBottom: 4, marginTop: 6 },
    subText: { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },
    clientGroup: { alignItems: 'flex-end' },
    clientTag: { fontSize: 7.5, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
    clientName: { fontSize: 12, fontFamily: bold, color: textColor, marginBottom: 3 },

    // Meta strip
    metaStrip: {
      flexDirection: 'row', marginBottom: 28,
      backgroundColor: primary, borderRadius: 6, overflow: 'hidden',
    },
    metaItem: { flex: 1, padding: 14 },
    metaItemBorder: { flex: 1, padding: 14, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)' },
    metaLabel: { fontSize: 7, fontFamily: bold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    metaValue: { fontSize: 11, fontFamily: bold, color: '#ffffff' },
  });

  return (
    <Document>
      {/* ── PAGINA 1: COVER ── */}
      <Page size="A4" style={cv.page}>
        {/* Geometrie decorative */}
        <View style={cv.geomTopRight} />
        <View style={cv.geomBottomLeft} />
        <View style={cv.geomAccentRight} />
        <View style={cv.geomAccentBottom} />

        <View style={cv.inner}>
          {/* TOP: logo + nome */}
          <View style={cv.topRow}>
            {sender.logo
              ? <PDFLogo src={sender.logo} theme={theme} baseWidth={200} baseHeight={72} />
              : null}
            <View style={cv.senderBlock}>
              {sender.name && <Text style={cv.senderName}>{sender.name}</Text>}
              {sender.vatNumber && <Text style={cv.senderSub}>P.IVA {sender.vatNumber}</Text>}
              {sender.email && <Text style={cv.senderSub}>{sender.email}</Text>}
            </View>
          </View>

          {/* CENTER: titolo grande */}
          <View style={cv.centerBlock}>
            <Text style={cv.eyebrow}>Documento Commerciale</Text>
            <Text style={cv.mainTitle}>Preven{'\n'}tivo.</Text>
            <View style={cv.accentBar} />
            <View style={cv.metaRow}>
              <View style={cv.metaBlock}>
                <Text style={cv.metaLabel}>Numero</Text>
                <Text style={cv.metaValue}>#{quote.number}</Text>
              </View>
              <View style={cv.metaBlock}>
                <Text style={cv.metaLabel}>Data</Text>
                <Text style={cv.metaValue}>{formatDate(quote.createdAt)}</Text>
              </View>
              <View style={cv.metaBlock}>
                <Text style={cv.metaLabel}>Validità</Text>
                <Text style={cv.metaValue}>{quote.validityDays} giorni</Text>
              </View>
            </View>
          </View>

          {/* BOTTOM: cliente + totale */}
          <View style={cv.bottomRow}>
            <View style={cv.clientCard}>
              <Text style={cv.clientEyebrow}>Preparato per</Text>
              <Text style={cv.clientName}>{client.name || 'Cliente'}</Text>
              {client.address && <Text style={cv.clientSub}>{client.address}</Text>}
              {(client.city || client.postalCode) && (
                <Text style={cv.clientSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
              )}
              {client.vatNumber && <Text style={cv.clientSub}>P.IVA {client.vatNumber}</Text>}
              {client.email && <Text style={cv.clientSub}>{client.email}</Text>}
            </View>

            {total > 0 && (
              <View style={cv.totalBlock}>
                <Text style={cv.totalLabel}>Importo Totale</Text>
                <Text style={cv.totalValue}>{fmt(total, quote.currency)}</Text>
                <Text style={cv.totalSub}>IVA inclusa</Text>
              </View>
            )}
          </View>
        </View>
      </Page>

      {/* ── PAGINA 2: CONTENUTO ── */}
      <Page size="A4" style={pg.page}>
        <View style={pg.topBar} fixed />
        <View style={pg.accentBar} fixed />
        <View style={pg.inner}>
          {/* Header */}
          <View style={pg.header}>
            <View>
              {sender.logo
                ? <PDFLogo src={sender.logo} theme={theme} baseWidth={160} baseHeight={58} />
                : <Text style={pg.senderName}>{sender.name || 'Nome Azienda'}</Text>}
              {sender.logo && sender.name && <Text style={pg.senderName}>{sender.name}</Text>}
              {sender.address && <Text style={pg.subText}>{sender.address}</Text>}
              {(sender.city || sender.postalCode) && (
                <Text style={pg.subText}>{sender.postalCode} {sender.city}</Text>
              )}
              {sender.vatNumber && <Text style={pg.subText}>P.IVA {sender.vatNumber}</Text>}
              {sender.email && <Text style={pg.subText}>{sender.email}</Text>}
            </View>
            <View style={pg.clientGroup}>
              <Text style={pg.clientTag}>Spettabile</Text>
              <Text style={pg.clientName}>{client.name || 'Cliente'}</Text>
              {client.address && <Text style={[pg.subText, { textAlign: 'right' }]}>{client.address}</Text>}
              {(client.city || client.postalCode) && (
                <Text style={[pg.subText, { textAlign: 'right' }]}>{client.postalCode} {client.city}</Text>
              )}
              {client.vatNumber && <Text style={[pg.subText, { textAlign: 'right' }]}>P.IVA {client.vatNumber}</Text>}
            </View>
          </View>

          {/* Meta strip */}
          <View style={pg.metaStrip}>
            <View style={pg.metaItem}>
              <Text style={pg.metaLabel}>Numero Preventivo</Text>
              <Text style={pg.metaValue}>#{quote.number}</Text>
            </View>
            <View style={pg.metaItemBorder}>
              <Text style={pg.metaLabel}>Data Emissione</Text>
              <Text style={pg.metaValue}>{formatDate(quote.createdAt)}</Text>
            </View>
            <View style={pg.metaItemBorder}>
              <Text style={pg.metaLabel}>Validità Offerta</Text>
              <Text style={pg.metaValue}>{quote.validityDays} giorni</Text>
            </View>
          </View>

          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
