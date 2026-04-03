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

// ─── Corporate Template ──────────────────────────────────────────────────────
// Design: "Professional Report" — header in tre sezioni: logo+mittente |
// dati preventivo | cliente. Barra accent spessa sotto. Due address-box
// grigi fianco a fianco con angoli arrotondati. Stile documento formale.
// ─────────────────────────────────────────────────────────────────────────────

export const CorporateTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent  = theme.accentColor  ?? primary;
  const text    = theme.textColor    ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font, padding: 36 },

    // Top row: 3 colonne
    topRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 18,
    },
    colLogo:   { width: '34%' },
    colCenter: { width: '30%', alignItems: 'center' },
    colClient: { width: '33%', alignItems: 'flex-end' },

    senderName: { fontSize: 13, fontFamily: bold, color: text, marginBottom: 4, marginTop: 6 },
    senderSub:  { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    // Colonna centrale: titolo preventivo
    titleLabel: { fontSize: 8, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    titleNum:   { fontSize: 18, fontFamily: bold, color: primary, marginBottom: 4, textAlign: 'center' },
    titleDate:  { fontSize: 8.5, color: '#64748b', textAlign: 'center', marginBottom: 2 },

    // Colonna destra: cliente
    clientLabel: { fontSize: 7.5, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
    clientName:  { fontSize: 12, fontFamily: bold, color: text, marginBottom: 3 },
    clientSub:   { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4, textAlign: 'right' },

    // Barra accent spessa
    accentBar: { height: 6, backgroundColor: primary, marginBottom: 4 },
    accentBar2: { height: 2, backgroundColor: accent, marginBottom: 22, opacity: accent === primary ? 0 : 1 },

    // Address boxes
    addressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
    addressBox: {
      width: '47%', backgroundColor: '#f8fafc', padding: 14,
      borderTopLeftRadius: 6, borderTopRightRadius: 6,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
      borderTopWidth: 1, borderTopColor: '#e2e8f0',
      borderRightWidth: 1, borderRightColor: '#e2e8f0',
      borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
      borderLeftWidth: 1, borderLeftColor: '#e2e8f0',
    },
    addressBoxAccent: {
      width: '47%', backgroundColor: '#f8fafc', padding: 14,
      borderTopLeftRadius: 6, borderTopRightRadius: 6,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
      borderTopWidth: 1, borderTopColor: '#e2e8f0',
      borderRightWidth: 1, borderRightColor: '#e2e8f0',
      borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
      borderLeftWidth: 3, borderLeftColor: accent,
    },
    addressLabel: { fontSize: 7.5, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
    addressName:  { fontSize: 11, fontFamily: bold, color: text, marginBottom: 3 },
    addressText:  { fontSize: 8.5, color: '#475569', marginBottom: 2, lineHeight: 1.4 },

    // Firma
    signatureBlock: { marginTop: 28, flexDirection: 'row', justifyContent: 'flex-end' },
    signatureLine:  { width: 180, borderTopWidth: 1, borderTopColor: '#94a3b8', paddingTop: 6, alignItems: 'center' },
    signatureText:  { fontSize: 8.5, color: '#64748b' },
  });

  const logoEl = sender.logo
    ? <PDFLogo src={sender.logo} theme={theme} baseWidth={180} baseHeight={64} />
    : null;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Logo centrato */}
        {logoPos === 'center' && logoEl && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>{logoEl}</View>
        )}

        {/* Top 3-colonne */}
        <View style={s.topRow}>
          <View style={s.colLogo}>
            {logoPos !== 'center' && logoPos !== 'right' && logoEl}
            {logoPos === 'right' && null}
            {!sender.logo && <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text>}
            {sender.logo && sender.name && <Text style={s.senderName}>{sender.name}</Text>}
            {sender.vatNumber && <Text style={s.senderSub}>P.IVA {sender.vatNumber}</Text>}
            {sender.email && <Text style={s.senderSub}>{sender.email}</Text>}
            {sender.phone && <Text style={s.senderSub}>{sender.phone}</Text>}
          </View>

          <View style={s.colCenter}>
            <Text style={s.titleLabel}>Preventivo</Text>
            <Text style={s.titleNum}>#{quote.number}</Text>
            <Text style={s.titleDate}>{formatDate(quote.createdAt)}</Text>
            <Text style={s.titleDate}>Valido {quote.validityDays} giorni</Text>
          </View>

          <View style={s.colClient}>
            {logoPos === 'right' && logoEl && (
              <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>{logoEl}</View>
            )}
            <Text style={s.clientLabel}>Destinatario</Text>
            <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
            {client.address && <Text style={s.clientSub}>{client.address}</Text>}
            {(client.city || client.postalCode) && (
              <Text style={s.clientSub}>{client.postalCode} {client.city}</Text>
            )}
            {client.vatNumber && <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text>}
            {client.email && <Text style={s.clientSub}>{client.email}</Text>}
            {client.customFields?.map(f => <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>)}
          </View>
        </View>

        {/* Barre accent */}
        <View style={s.accentBar} />
        <View style={s.accentBar2} />

        {/* Address boxes */}
        <View style={s.addressRow}>
          <View style={s.addressBox}>
            <Text style={s.addressLabel}>Mittente</Text>
            <Text style={s.addressName}>{sender.name || '—'}</Text>
            {sender.address && <Text style={s.addressText}>{sender.address}</Text>}
            {(sender.city || sender.postalCode) && (
              <Text style={s.addressText}>{sender.postalCode} {sender.city}</Text>
            )}
            {sender.vatNumber && <Text style={s.addressText}>P.IVA {sender.vatNumber}</Text>}
            {sender.email && <Text style={s.addressText}>{sender.email}</Text>}
            {sender.phone && <Text style={s.addressText}>{sender.phone}</Text>}
          </View>
          <View style={s.addressBoxAccent}>
            <Text style={[s.addressLabel, { color: accent }]}>Spettabile</Text>
            <Text style={s.addressName}>{client.name || '—'}</Text>
            {client.address && <Text style={s.addressText}>{client.address}</Text>}
            {(client.city || client.postalCode) && (
              <Text style={s.addressText}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
            )}
            {client.vatNumber && <Text style={s.addressText}>P.IVA {client.vatNumber}</Text>}
            {client.email && <Text style={s.addressText}>{client.email}</Text>}
            {client.customFields?.map(f => <Text key={f.id} style={s.addressText}>{f.label}: {f.value}</Text>)}
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
