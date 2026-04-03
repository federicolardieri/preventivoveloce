import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { Quote, FontFamily } from '@/types/quote';
import { PDFItemsTable } from '../components/PDFItemsTable';
import { PDFFooter } from '../components/PDFFooter';
import { PDFLogo } from '../components/PDFLogo';

function boldFont(family: FontFamily): string {
  if (family === 'Times-Roman') return 'Times-Bold';
  if (family === 'Courier') return 'Courier-Bold';
  return 'Helvetica-Bold';
}

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
};

// ─── Modern Template ─────────────────────────────────────────────────────────
// Design: "Dark Header Professional" — ispirato all'esempio Edil Padel
// Header scuro full-bleed con logo a sinistra e numero preventivo a destra.
// Strip accent sotto header. Info cliente su card bianca con bordo sinistro.
// Corpo bianco pulito.
// ─────────────────────────────────────────────────────────────────────────────

export const ModernTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#111111';
  const accent  = theme.accentColor  ?? '#1e293b';
  const text    = theme.textColor    ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },

    // Header scuro
    header: {
      backgroundColor: primary,
      paddingTop: 30,
      paddingHorizontal: 40,
      paddingBottom: 0,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },

    // Blocco mittente / logo (sx)
    senderBlock: { flexDirection: 'column' },
    senderName: { fontSize: 15, fontFamily: bold, color: '#ffffff', marginBottom: 4, marginTop: 6 },
    senderSub:  { fontSize: 8.5, color: 'rgba(255,255,255,0.6)', marginBottom: 2, lineHeight: 1.4 },

    // Blocco numero preventivo (dx)
    quoteBlock:   { alignItems: 'flex-end' },
    quoteEyebrow: {
      fontSize: 10, fontFamily: bold, color: 'rgba(255,255,255,0.65)',
      textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6,
    },
    quoteNum:  { fontSize: 36, fontFamily: bold, color: '#ffffff', lineHeight: 1, marginBottom: 4 },
    quoteMeta: { fontSize: 8.5, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },

    // Barra accent sotto header
    accentBar: { height: 4, backgroundColor: accent },

    // Card cliente — fuori dall'header, sovrapponendosi leggermente
    clientWrapper: { paddingHorizontal: 40 },
    clientCard: {
      backgroundColor: '#ffffff',
      borderLeftWidth: 4, borderLeftColor: accent,
      borderTopWidth: 1, borderTopColor: '#e2e8f0',
      borderRightWidth: 1, borderRightColor: '#e2e8f0',
      borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
      padding: 14, marginTop: 16,
    },
    clientLabel: { fontSize: 7.5, fontFamily: bold, color: accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
    clientName:  { fontSize: 13, fontFamily: bold, color: text, marginBottom: 3 },
    clientRow:   { flexDirection: 'row', gap: 32 },
    clientSub:   { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    body: { paddingHorizontal: 40, paddingTop: 20, paddingBottom: 36 },
  });

  const logoEl = sender.logo
    ? <PDFLogo src={sender.logo} theme={theme} baseWidth={180} baseHeight={64} />
    : null;

  const senderBlock = (
    <View style={s.senderBlock}>
      {logoPos !== 'center' && logoEl}
      {!sender.logo && <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text>}
      {sender.logo && sender.name && <Text style={s.senderName}>{sender.name}</Text>}
      {sender.vatNumber && <Text style={s.senderSub}>P.IVA {sender.vatNumber}</Text>}
      {sender.email && <Text style={s.senderSub}>{sender.email}</Text>}
      {sender.phone && <Text style={s.senderSub}>{sender.phone}</Text>}
      {sender.address && <Text style={s.senderSub}>{sender.address}{sender.city ? `, ${sender.city}` : ''}</Text>}
    </View>
  );

  const quoteBlock = (
    <View style={s.quoteBlock}>
      <Text style={s.quoteEyebrow}>Preventivo Ufficiale</Text>
      <Text style={s.quoteNum}>#{quote.number}</Text>
      <Text style={s.quoteMeta}>{formatDate(quote.createdAt)}</Text>
      <Text style={s.quoteMeta}>Validità: {quote.validityDays} giorni</Text>
    </View>
  );

  const headerTopContent = logoPos === 'right'
    ? <>{quoteBlock}{senderBlock}</>
    : <>{senderBlock}{quoteBlock}</>;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header scuro */}
        <View style={s.header}>
          {logoPos === 'center' && logoEl && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>{logoEl}</View>
          )}
          <View style={s.headerTop}>
            {headerTopContent}
          </View>
          <View style={s.accentBar} />
        </View>

        {/* Cliente */}
        <View style={s.clientWrapper}>
          <View style={s.clientCard}>
            <Text style={s.clientLabel}>Destinatario</Text>
            <View style={s.clientRow}>
              <View>
                <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
                {client.address && <Text style={s.clientSub}>{client.address}</Text>}
                {(client.city || client.postalCode) && (
                  <Text style={s.clientSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
                )}
              </View>
              <View>
                {client.vatNumber && <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text>}
                {client.email && <Text style={s.clientSub}>{client.email}</Text>}
                {client.phone && <Text style={s.clientSub}>{client.phone}</Text>}
                {client.customFields?.map(f => <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>)}
              </View>
            </View>
          </View>
        </View>

        <View style={s.body}>
          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
