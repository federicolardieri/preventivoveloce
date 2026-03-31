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

export const ModernTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent = theme.accentColor ?? primary;
  const textColor = theme.textColor ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },
    summaryAccent: { height: 12, backgroundColor: accent, marginBottom: 20 },
    header: { backgroundColor: primary, paddingTop: 32, paddingHorizontal: 36, paddingBottom: 28 },
    headerTop: {
      flexDirection: 'row',
      justifyContent: logoPos === 'center' ? 'center' : 'space-between',
      alignItems: 'flex-start',
      marginBottom: 22,
    },
    logo:       { width: 220, height: 80, objectFit: 'contain', marginBottom: 8 },
    senderName: { fontSize: 17, fontFamily: bold, color: '#ffffff', marginBottom: 5 },
    senderSub:  { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 2.5, lineHeight: 1.4 },
    titleBlock: { alignItems: 'flex-end' },
    title:      { fontSize: 24, fontFamily: bold, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 2 },
    quoteNum:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 5 },
    quoteSub:   { fontSize: 9.5, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
    clientStrip: {
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
      paddingTop: 16, flexDirection: 'row', alignItems: 'flex-start',
    },
    clientLabel: { fontSize: 8, fontFamily: bold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    clientName:  { fontSize: 13, fontFamily: bold, color: '#ffffff', marginBottom: 3 },
    clientSub:   { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
    body: { paddingHorizontal: 36, paddingTop: 28, paddingBottom: 36 },
  });

  const senderBlock = (
    <View>
      {sender.logo
        ? <PDFLogo src={sender.logo} theme={theme} baseWidth={220} baseHeight={80} />
        : <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text>}
      {sender.logo && sender.name ? <Text style={s.senderName}>{sender.name}</Text> : null}
      {sender.address ? <Text style={s.senderSub}>{sender.address}</Text> : null}
      {(sender.city || sender.postalCode) ? (
        <Text style={s.senderSub}>{sender.postalCode} {sender.city}</Text>
      ) : null}
      {sender.vatNumber ? <Text style={s.senderSub}>P.IVA {sender.vatNumber}</Text> : null}
      {sender.email ? <Text style={s.senderSub}>{sender.email}</Text> : null}
      {sender.phone ? <Text style={s.senderSub}>{sender.phone}</Text> : null}
    </View>
  );

  const titleBlock = (
    <View style={s.titleBlock}>
      <Text style={s.title}>Preventivo</Text>
      <Text style={s.quoteNum}>#{quote.number}</Text>
      <Text style={s.quoteSub}>{formatDate(quote.createdAt)}</Text>
      <Text style={s.quoteSub}>Valido {quote.validityDays} giorni</Text>
    </View>
  );

  // center = solo sender (con logo) centrato, il titolo va sotto
  const headerTopContent = logoPos === 'center'
    ? senderBlock
    : logoPos === 'right'
      ? <>{titleBlock}{senderBlock}</>
      : <>{senderBlock}{titleBlock}</>;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerTop}>
            {headerTopContent}
          </View>
          {logoPos === 'center' && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
              {titleBlock}
            </View>
          )}

          <View style={s.clientStrip}>
            <View>
              <Text style={s.clientLabel}>Destinatario</Text>
              <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
              {client.address ? <Text style={s.clientSub}>{client.address}</Text> : null}
              {(client.city || client.postalCode) ? (
                <Text style={s.clientSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
              ) : null}
              {client.vatNumber ? <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text> : null}
              {client.email ? <Text style={s.clientSub}>{client.email}</Text> : null}
              {client.customFields?.map(f => (
                <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>
              ))}
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
