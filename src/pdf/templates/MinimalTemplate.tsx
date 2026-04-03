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

// ─── Minimal Template ────────────────────────────────────────────────────────
// Design: "Swiss Typography" — nessun sfondo colorato, solo testo e linee
// sottilissime. Numero preventivo in grande come elemento grafico dominante.
// Accent color usato solo per dettagli. Stile editoriale / studio di design.
// ─────────────────────────────────────────────────────────────────────────────

export const MinimalTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent  = theme.accentColor  ?? primary;
  const text    = theme.textColor    ?? '#111111';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { padding: 52, backgroundColor: '#ffffff', fontFamily: font },

    // Header
    headerRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 0,
    },
    senderCol: { width: '52%' },
    quoteCol:  { width: '46%', alignItems: 'flex-end' },

    senderName: { fontSize: 12, fontFamily: bold, color: text, marginBottom: 4 },
    senderSub:  { fontSize: 8.5, color: '#888888', marginBottom: 2, lineHeight: 1.4 },

    // Numero preventivo grande — elemento visivo dominante
    quoteNumBig: { fontSize: 22, fontFamily: bold, color: text, lineHeight: 1 },
    quoteLabel:  {
      fontSize: 7.5, fontFamily: bold, color: accent,
      textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6,
    },
    quoteSub:    { fontSize: 8.5, color: '#888888', marginBottom: 2, marginTop: 6 },

    // Separatore triplo
    sep1: { height: 2, backgroundColor: text, marginTop: 20, marginBottom: 3 },
    sep2: { height: 0.5, backgroundColor: accent },

    // Sezione cliente
    clientRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginTop: 20, marginBottom: 28,
    },
    clientCol:   { width: '48%' },
    clientLabel: { fontSize: 7.5, fontFamily: bold, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    clientName:  { fontSize: 12, fontFamily: bold, color: text, marginBottom: 3 },
    clientSub:   { fontSize: 8.5, color: '#666666', marginBottom: 2, lineHeight: 1.4 },
  });

  const logoEl = sender.logo
    ? <PDFLogo src={sender.logo} theme={theme} baseWidth={160} baseHeight={56} />
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
      <Text style={s.quoteLabel}>Preventivo</Text>
      <Text style={s.quoteNumBig}>#{quote.number}</Text>
      <Text style={s.quoteSub}>{formatDate(quote.createdAt)}</Text>
      <Text style={s.quoteSub}>Valido {quote.validityDays} giorni</Text>
    </View>
  );

  const headerContent = logoPos === 'right'
    ? (
      <View style={s.headerRow}>
        <View style={s.quoteCol}>{quoteBlock}</View>
        <View style={{ width: '52%', alignItems: 'flex-end' }}>{senderBlock}</View>
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
        {logoPos === 'center' && logoEl && (
          <View style={{ alignItems: 'center', marginBottom: 20 }}>{logoEl}</View>
        )}

        {headerContent}

        {/* Separatore doppio */}
        <View style={s.sep1} />
        <View style={s.sep2} />

        {/* Mittente e cliente affiancati */}
        <View style={s.clientRow}>
          <View style={s.clientCol}>
            <Text style={s.clientLabel}>Da</Text>
            <Text style={s.clientName}>{sender.name || 'Nome Azienda'}</Text>
            {sender.address && <Text style={s.clientSub}>{sender.address}</Text>}
            {(sender.city || sender.postalCode) && (
              <Text style={s.clientSub}>{sender.postalCode} {sender.city}</Text>
            )}
            {sender.vatNumber && <Text style={s.clientSub}>P.IVA {sender.vatNumber}</Text>}
          </View>
          <View style={s.clientCol}>
            <Text style={s.clientLabel}>A</Text>
            <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
            {client.address && <Text style={s.clientSub}>{client.address}</Text>}
            {(client.city || client.postalCode) && (
              <Text style={s.clientSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
            )}
            {client.vatNumber && <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text>}
            {client.email && <Text style={s.clientSub}>{client.email}</Text>}
            {client.customFields?.map(f => <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>)}
          </View>
        </View>

        <PDFItemsTable quote={quote} />
        <PDFFooter quote={quote} />
      </Page>
    </Document>
  );
};
