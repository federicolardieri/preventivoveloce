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

export const CorporateTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent = theme.accentColor ?? primary;
  const textColor = theme.textColor ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font, padding: 36 },

    // Top bar: logo/name left, quote title right
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    logo:   { width: 210, height: 75, objectFit: 'contain' },
    senderName: { fontSize: 15, fontFamily: bold, color: textColor, marginBottom: 4 },
    senderSub:  { fontSize: 9, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    titleBlock:  { alignItems: 'flex-end' },
    title:       { fontSize: 26, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 1 },
    quoteNum:    { fontSize: 11, color: '#64748b', marginTop: 4 },
    quoteDate:   { fontSize: 9, color: '#94a3b8', marginTop: 3 },

    // Divider
    accentBar:  { height: 4, backgroundColor: accent, marginBottom: 20 },

    // Address boxes
    addressRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    addressBox:    { width: '47%', backgroundColor: '#f8fafc', padding: 14, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
    addressLabel:  { fontSize: 8, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    addressName:   { fontSize: 11, fontFamily: bold, color: textColor, marginBottom: 3 },
    addressText:   { fontSize: 9, color: '#475569', marginBottom: 2, lineHeight: 1.4 },

    // Signature
    signatureBlock: { marginTop: 32, flexDirection: 'row', justifyContent: 'flex-end' },
    signatureLine:  { width: 200, borderTopWidth: 1, borderTopColor: '#94a3b8', paddingTop: 6, alignItems: 'center' },
    signatureText:  { fontSize: 9, color: '#64748b' },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Top: sender + quote title — rispetta logoPos */}
        {logoPos === 'center' && sender.logo && (
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <PDFLogo src={sender.logo} theme={theme} baseWidth={210} baseHeight={75} />
          </View>
        )}
        <View style={[s.topRow, logoPos === 'right' ? { flexDirection: 'row-reverse' } : {}]}>
          <View>
            {logoPos !== 'center' && sender.logo
              ? <PDFLogo src={sender.logo} theme={theme} baseWidth={210} baseHeight={75} />
              : null}
            {!sender.logo ? <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text> : null}
            {sender.logo && sender.name ? <Text style={s.senderName}>{sender.name}</Text> : null}
            {sender.address ? <Text style={s.senderSub}>{sender.address}</Text> : null}
            {(sender.city || sender.postalCode) ? (
              <Text style={s.senderSub}>{sender.postalCode} {sender.city}</Text>
            ) : null}
            {sender.vatNumber ? <Text style={s.senderSub}>P.IVA {sender.vatNumber}</Text> : null}
            {sender.email ? <Text style={s.senderSub}>{sender.email}</Text> : null}
          </View>
          <View style={s.titleBlock}>
            <Text style={s.title}>Preventivo</Text>
            <Text style={s.quoteNum}>#{quote.number}</Text>
            <Text style={s.quoteDate}>Data: {formatDate(quote.createdAt)}</Text>
            <Text style={s.quoteDate}>Validità: {quote.validityDays} giorni</Text>
          </View>
        </View>

        {/* Primary color divider */}
        <View style={s.accentBar} />

        {/* Sender / Client address boxes */}
        <View style={s.addressRow}>
          <View style={s.addressBox}>
            <Text style={s.addressLabel}>Mittente</Text>
            <Text style={s.addressName}>{sender.name || '—'}</Text>
            {sender.address ? <Text style={s.addressText}>{sender.address}</Text> : null}
            {(sender.city || sender.postalCode) ? (
              <Text style={s.addressText}>{sender.postalCode} {sender.city}</Text>
            ) : null}
            {sender.vatNumber ? <Text style={s.addressText}>P.IVA {sender.vatNumber}</Text> : null}
            {sender.email ? <Text style={s.addressText}>{sender.email}</Text> : null}
            {sender.phone ? <Text style={s.addressText}>{sender.phone}</Text> : null}
          </View>
          <View style={s.addressBox}>
            <Text style={s.addressLabel}>Destinatario</Text>
            <Text style={s.addressName}>{client.name || '—'}</Text>
            {client.address ? <Text style={s.addressText}>{client.address}</Text> : null}
            {(client.city || client.postalCode) ? (
              <Text style={s.addressText}>{client.postalCode} {client.city}</Text>
            ) : null}
            {client.vatNumber ? <Text style={s.addressText}>P.IVA {client.vatNumber}</Text> : null}
            {client.email ? <Text style={s.addressText}>{client.email}</Text> : null}
            {client.customFields?.map(f => (
              <Text key={f.id} style={s.addressText}>{f.label}: {f.value}</Text>
            ))}
          </View>
        </View>

        <PDFItemsTable quote={quote} />
        <PDFFooter quote={quote} />

        <View style={s.signatureBlock}>
          <View style={s.signatureLine}>
            <Text style={s.signatureText}>Firma per Accettazione</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
