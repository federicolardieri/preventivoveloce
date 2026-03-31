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

export const CreativeTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent  = theme.accentColor  ?? '#1d4ed8';
  const textColor = theme.textColor  ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },

    // Decorative top band: two-tone
    topBand: { flexDirection: 'row', height: 8 },
    bandLeft:  { flex: 1, backgroundColor: primary },
    bandRight: { flex: 1, backgroundColor: accent },

    content: { padding: 38 },

    // Header: big title left, meta right
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
    titleBlock: {},
    title:      { fontSize: 34, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 2, lineHeight: 1 },
    titleAccent:{ fontSize: 11, color: accent, fontFamily: bold, letterSpacing: 1, marginTop: 4 },
    metaBlock:  { alignItems: 'flex-end' },
    metaNum:    { fontSize: 13, fontFamily: bold, color: textColor, marginBottom: 3 },
    metaSub:    { fontSize: 9, color: '#64748b', marginBottom: 2 },

    // Two columns: sender + client
    infoRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
    infoBox:     { width: '47%' },
    infoLabel:   { fontSize: 8, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, borderBottomWidth: 1.5, borderBottomColor: primary, paddingBottom: 4 },
    infoName:    { fontSize: 11, fontFamily: bold, color: textColor, marginBottom: 3, marginTop: 6 },
    infoSub:     { fontSize: 9, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    logo: { width: 170, height: 68, objectFit: 'contain', marginBottom: 6 },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Two-tone decorative band — fixed so repeats on multipage */}
        <View style={s.topBand} fixed>
          <View style={s.bandLeft} />
          <View style={s.bandRight} />
        </View>

        <View style={s.content}>
          {/* Big title header */}
          <View style={s.headerRow}>
            <View style={s.titleBlock}>
              <Text style={s.title}>Preventivo</Text>
              <Text style={s.titleAccent}>#{quote.number}</Text>
            </View>
            <View style={s.metaBlock}>
              <Text style={s.metaNum}>{formatDate(quote.createdAt)}</Text>
              <Text style={s.metaSub}>Validità {quote.validityDays} giorni</Text>
            </View>
          </View>

          {/* Logo centrato sopra le colonne se logoPos === 'center' */}
          {logoPos === 'center' && sender.logo && (
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <PDFLogo src={sender.logo} theme={theme} baseWidth={170} baseHeight={68} />
            </View>
          )}

          {/* Sender + Client side by side */}
          <View style={s.infoRow}>
            {/* Sender */}
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Da</Text>
              {logoPos !== 'center' && sender.logo
                ? <View style={{ alignSelf: logoPos === 'right' ? 'flex-end' : 'flex-start' }}><PDFLogo src={sender.logo} theme={theme} baseWidth={170} baseHeight={68} /></View>
                : null}
              <Text style={s.infoName}>{sender.name || 'Nome Azienda'}</Text>
              {sender.address ? <Text style={s.infoSub}>{sender.address}</Text> : null}
              {(sender.city || sender.postalCode) ? (
                <Text style={s.infoSub}>{sender.postalCode} {sender.city}</Text>
              ) : null}
              {sender.vatNumber ? <Text style={s.infoSub}>P.IVA {sender.vatNumber}</Text> : null}
              {sender.email ? <Text style={s.infoSub}>{sender.email}</Text> : null}
              {sender.phone ? <Text style={s.infoSub}>{sender.phone}</Text> : null}
              {sender.customFields?.map(f => (
                <Text key={f.id} style={s.infoSub}>{f.label}: {f.value}</Text>
              ))}
            </View>

            {/* Client */}
            <View style={s.infoBox}>
              <Text style={[s.infoLabel, { color: accent, borderBottomColor: accent }]}>A</Text>
              <Text style={s.infoName}>{client.name || 'Cliente'}</Text>
              {client.address ? <Text style={s.infoSub}>{client.address}</Text> : null}
              {(client.city || client.postalCode) ? (
                <Text style={s.infoSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
              ) : null}
              {client.vatNumber ? <Text style={s.infoSub}>P.IVA {client.vatNumber}</Text> : null}
              {client.email ? <Text style={s.infoSub}>{client.email}</Text> : null}
              {client.customFields?.map(f => (
                <Text key={f.id} style={s.infoSub}>{f.label}: {f.value}</Text>
              ))}
            </View>
          </View>

          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
