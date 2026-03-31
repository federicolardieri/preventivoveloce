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

export const MinimalTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const logoPos = theme.logoPosition ?? 'left';

  const primary = theme.primaryColor ?? '#5c32e6';
  const accent = theme.accentColor ?? primary;
  const textColor = theme.textColor ?? '#1e293b';

  // Force pure monochrome theme for all sub-components
  const minimalQuote: Quote = {
    ...quote,
    theme: { ...theme, primaryColor: primary, accentColor: accent, textColor: textColor },
  };

  const s = StyleSheet.create({
    page:       { padding: 52, backgroundColor: '#ffffff', fontFamily: font },
    headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    leftCol:    { width: '56%' },
    rightCol:   { width: '42%', alignItems: 'flex-end' },
    logo:       { width: 220, height: 78, objectFit: 'contain', marginBottom: 10 },
    senderName: { fontSize: 13, fontFamily: bold, color: '#111111', marginBottom: 5 },
    subText:    { fontSize: 9, color: '#666666', marginBottom: 2.5, lineHeight: 1.4 },
    title:      { fontSize: 22, fontFamily: bold, color: '#111111', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 },
    quoteNum:   { fontSize: 11, color: '#888888', marginBottom: 2.5 },
    separator:  { height: 0.75, backgroundColor: '#cccccc', marginBottom: 20 },
    footerAccent: { height: 3, backgroundColor: accent, marginBottom: 20 },
    clientLabel:{ fontSize: 8, fontFamily: bold, color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
    clientName: { fontSize: 12, fontFamily: bold, color: '#111111', marginBottom: 3 },
    clientSub:  { fontSize: 9, color: '#666666', marginBottom: 2 },
  });

  const logoEl = sender.logo ? <PDFLogo src={sender.logo} theme={theme} baseWidth={220} baseHeight={78} /> : null;

  const senderInfo = (
    <>
      {!sender.logo ? <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text> : null}
      {sender.logo && sender.name ? <Text style={s.senderName}>{sender.name}</Text> : null}
      {sender.address ? <Text style={s.subText}>{sender.address}</Text> : null}
      {(sender.city || sender.postalCode) ? (
        <Text style={s.subText}>{sender.postalCode} {sender.city}</Text>
      ) : null}
      {sender.vatNumber ? <Text style={s.subText}>P.IVA {sender.vatNumber}</Text> : null}
      {sender.email ? <Text style={s.subText}>{sender.email}</Text> : null}
      {sender.phone ? <Text style={s.subText}>{sender.phone}</Text> : null}
      {sender.customFields?.map(f => (
        <Text key={f.id} style={s.subText}>{f.label}: {f.value}</Text>
      ))}
    </>
  );

  const titleEl = (align: 'flex-start' | 'flex-end') => (
    <View style={{ alignItems: align }}>
      <Text style={s.title}>Preventivo</Text>
      <Text style={s.quoteNum}>#{quote.number}</Text>
      <Text style={s.subText}>{formatDate(quote.createdAt)}</Text>
      <Text style={s.subText}>Valido {quote.validityDays} giorni</Text>
    </View>
  );

  const clientBlock = (align: 'flex-start' | 'flex-end') => (
    <View style={{ alignItems: align, marginBottom: 24 }}>
      <Text style={s.clientLabel}>Spettabile</Text>
      <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
      {client.address ? <Text style={s.clientSub}>{client.address}</Text> : null}
      {(client.city || client.postalCode) ? (
        <Text style={s.clientSub}>{client.postalCode} {client.city}</Text>
      ) : null}
      {client.vatNumber ? <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text> : null}
      {client.email ? <Text style={s.clientSub}>{client.email}</Text> : null}
      {client.customFields?.map(f => (
        <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>
      ))}
    </View>
  );

  let header;
  if (logoPos === 'center') {
    header = (
      <>
        {logoEl && <View style={{ alignItems: 'center', marginBottom: 12 }}>{logoEl}</View>}
        <View style={s.headerRow}>
          <View style={s.leftCol}>{senderInfo}</View>
          <View style={s.rightCol}>{titleEl('flex-end')}</View>
        </View>
      </>
    );
  } else if (logoPos === 'right') {
    header = (
      <View style={s.headerRow}>
        <View style={{ width: '42%' }}>{titleEl('flex-start')}</View>
        <View style={{ width: '56%' }}>{logoEl}{senderInfo}</View>
      </View>
    );
  } else {
    header = (
      <View style={s.headerRow}>
        <View style={s.leftCol}>{logoEl}{senderInfo}</View>
        <View style={s.rightCol}>{titleEl('flex-end')}</View>
      </View>
    );
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {header}
        <View style={s.separator} />
        {clientBlock('flex-end')}
        <PDFItemsTable quote={minimalQuote} />
        <PDFFooter quote={minimalQuote} />
      </Page>
    </Document>
  );
};
