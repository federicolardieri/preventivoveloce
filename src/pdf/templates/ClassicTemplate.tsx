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

export const ClassicTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent = theme.accentColor ?? primary;
  const textColor = theme.textColor ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page:        { backgroundColor: '#ffffff', fontFamily: font },
    accentBar:   { height: 6, backgroundColor: accent },
    content:     { padding: 40 },
    headerRow:   { flexDirection: 'row', marginBottom: 32 },
    leftCol:     { width: '54%', paddingRight: 20 },
    rightCol:    { width: '46%', alignItems: 'flex-end' },
    logo:        { width: 240, height: 85, objectFit: 'contain', marginBottom: 10 },
    senderName:  { fontSize: 15, fontFamily: bold, color: textColor, marginBottom: 5 },
    subText:     { fontSize: 9, color: '#64748b', marginBottom: 2.5, lineHeight: 1.4 },
    title:       { fontSize: 28, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 1.5 },
    quoteNum:    { fontSize: 11, color: '#64748b', marginTop: 4 },
    clientLabel: { fontSize: 8, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    clientName:  { fontSize: 13, fontFamily: bold, color: textColor, marginBottom: 3 },
    divider:     { height: 1, backgroundColor: '#e2e8f0', marginBottom: 12 },
  });

  const logoEl = sender.logo ? <PDFLogo src={sender.logo} theme={theme} baseWidth={240} baseHeight={85} /> : null;

  const senderInfo = (
    <>
      {!sender.logo ? <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text> : null}
      {sender.logo && sender.name ? <Text style={s.senderName}>{sender.name}</Text> : null}
      {sender.address ? <Text style={s.subText}>{sender.address}</Text> : null}
      {(sender.city || sender.postalCode) ? (
        <Text style={s.subText}>{sender.postalCode} {sender.city}{sender.country ? ` (${sender.country})` : ''}</Text>
      ) : null}
      {sender.vatNumber ? <Text style={s.subText}>P.IVA/CF: {sender.vatNumber}</Text> : null}
      {sender.email ? <Text style={s.subText}>{sender.email}</Text> : null}
      {sender.phone ? <Text style={s.subText}>{sender.phone}</Text> : null}
      {sender.customFields?.map(f => (
        <Text key={f.id} style={s.subText}>{f.label}: {f.value}</Text>
      ))}
    </>
  );

  const titleBlock = (align: 'flex-start' | 'flex-end') => (
    <View style={{ alignItems: align, marginBottom: 20 }}>
      <Text style={s.title}>Preventivo</Text>
      <Text style={s.quoteNum}>#{quote.number}</Text>
      <Text style={[s.subText, { marginTop: 5 }]}>Data: {formatDate(quote.createdAt)}</Text>
      <Text style={s.subText}>Validità: {quote.validityDays} giorni</Text>
    </View>
  );

  const clientBlock = (align: 'flex-start' | 'flex-end') => (
    <View style={{ alignItems: align, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
      <Text style={s.clientLabel}>Spettabile</Text>
      <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
      {client.address ? <Text style={s.subText}>{client.address}</Text> : null}
      {(client.city || client.postalCode) ? (
        <Text style={s.subText}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
      ) : null}
      {client.vatNumber ? <Text style={s.subText}>P.IVA/CF: {client.vatNumber}</Text> : null}
      {client.email ? <Text style={s.subText}>{client.email}</Text> : null}
      {client.customFields?.map(f => (
        <Text key={f.id} style={s.subText}>{f.label}: {f.value}</Text>
      ))}
    </View>
  );

  let header;
  if (logoPos === 'center') {
    header = (
      <>
        {logoEl && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {logoEl}
          </View>
        )}
        <View style={s.headerRow}>
          <View style={s.leftCol}>{senderInfo}</View>
          <View style={s.rightCol}>
            {titleBlock('flex-end')}
            {clientBlock('flex-end')}
          </View>
        </View>
      </>
    );
  } else if (logoPos === 'right') {
    header = (
      <View style={s.headerRow}>
        <View style={{ width: '46%', paddingRight: 20 }}>
          {titleBlock('flex-start')}
          {clientBlock('flex-start')}
        </View>
        <View style={{ width: '54%' }}>
          {logoEl}
          {senderInfo}
        </View>
      </View>
    );
  } else {
    header = (
      <View style={s.headerRow}>
        <View style={s.leftCol}>
          {logoEl}
          {senderInfo}
        </View>
        <View style={s.rightCol}>
          {titleBlock('flex-end')}
          {clientBlock('flex-end')}
        </View>
      </View>
    );
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} fixed />
        <View style={s.content}>
          {header}
          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
