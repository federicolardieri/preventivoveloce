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

// ─── Classic Template ────────────────────────────────────────────────────────
// Design: "Italian Letterhead"
// Bordo accent verticale a sinistra (6pt), header due colonne, cliente su card
// grigio con bordo sinistro colorato. Stile formale e professionale.
// ─────────────────────────────────────────────────────────────────────────────

export const ClassicTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent  = theme.accentColor  ?? primary;
  const text    = theme.textColor    ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },

    // Bordo verticale colorato a sinistra — fixed per ripetersi su più pagine
    leftBorder: {
      position: 'absolute', top: 0, left: 0, bottom: 0, width: 6,
      backgroundColor: primary,
    },
    leftBorderAccent: {
      position: 'absolute', top: 0, left: 6, bottom: 0, width: 2,
      backgroundColor: accent, opacity: 0.25,
    },

    content: { paddingLeft: 52, paddingRight: 40, paddingTop: 36, paddingBottom: 36 },

    // Header: mittente a sinistra, preventivo a destra
    headerRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 20,
      paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    senderCol: { width: '55%' },
    quoteCol:  { width: '43%', alignItems: 'flex-end' },

    senderName: { fontSize: 13, fontFamily: bold, color: text, marginBottom: 4 },
    senderSub:  { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    // Titolo preventivo
    quoteEyebrow: {
      fontSize: 10, fontFamily: bold, color: primary,
      textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 6,
    },
    quoteNum:  { fontSize: 22, fontFamily: bold, color: text, lineHeight: 1, marginBottom: 6 },
    quoteSub:  { fontSize: 8.5, color: '#64748b', marginBottom: 2 },

    // Sezione cliente
    clientCard: {
      marginBottom: 22, backgroundColor: '#f8fafc',
      padding: 14, borderLeftWidth: 3, borderLeftColor: accent,
    },
    clientLabel: { fontSize: 7.5, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
    clientName:  { fontSize: 13, fontFamily: bold, color: text, marginBottom: 3 },
    clientSub:   { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },
  });

  const logoEl = sender.logo
    ? <PDFLogo src={sender.logo} theme={theme} baseWidth={180} baseHeight={64} />
    : null;

  const senderBlock = (
    <View>
      {logoPos !== 'center' && logoEl}
      {!sender.logo && <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text>}
      {sender.logo && sender.name && <Text style={s.senderName}>{sender.name}</Text>}
      {sender.address && <Text style={s.senderSub}>{sender.address}</Text>}
      {(sender.city || sender.postalCode) && (
        <Text style={s.senderSub}>{sender.postalCode} {sender.city}{sender.country ? ` (${sender.country})` : ''}</Text>
      )}
      {sender.vatNumber && <Text style={s.senderSub}>P.IVA {sender.vatNumber}</Text>}
      {sender.email && <Text style={s.senderSub}>{sender.email}</Text>}
      {sender.phone && <Text style={s.senderSub}>{sender.phone}</Text>}
      {sender.customFields?.map(f => <Text key={f.id} style={s.senderSub}>{f.label}: {f.value}</Text>)}
    </View>
  );

  const quoteBlock = (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={s.quoteEyebrow}>Preventivo</Text>
      <Text style={s.quoteNum}>#{quote.number}</Text>
      <Text style={s.quoteSub}>{formatDate(quote.createdAt)}</Text>
      <Text style={s.quoteSub}>Validità: {quote.validityDays} giorni</Text>
    </View>
  );

  const headerContent = logoPos === 'right'
    ? (
      <View style={s.headerRow}>
        <View style={{ width: '43%' }}>{quoteBlock}</View>
        <View style={{ width: '55%', alignItems: 'flex-end' }}>{senderBlock}</View>
      </View>
    )
    : (
      <View style={s.headerRow}>
        <View style={s.senderCol}>{senderBlock}</View>
        <View style={s.quoteCol}>{quoteBlock}</View>
      </View>
    );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.leftBorder} fixed />
        <View style={s.leftBorderAccent} fixed />

        <View style={s.content}>
          {/* Logo centrato sopra tutto */}
          {logoPos === 'center' && logoEl && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>{logoEl}</View>
          )}

          {headerContent}

          {/* Cliente */}
          <View style={s.clientCard}>
            <Text style={s.clientLabel}>Spettabile</Text>
            <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
            {client.address && <Text style={s.clientSub}>{client.address}</Text>}
            {(client.city || client.postalCode) && (
              <Text style={s.clientSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
            )}
            {client.vatNumber && <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text>}
            {client.email && <Text style={s.clientSub}>{client.email}</Text>}
            {client.customFields?.map(f => <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>)}
          </View>

          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
