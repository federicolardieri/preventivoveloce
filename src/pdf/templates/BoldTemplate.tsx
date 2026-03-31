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

export const BoldTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent = theme.accentColor ?? primary;
  const textColor = theme.textColor ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';
  const logoAlign = logoPos === 'right' ? 'flex-end' : logoPos === 'center' ? 'center' : 'flex-start';

  const s = StyleSheet.create({
    page: { flexDirection: 'row', backgroundColor: '#ffffff', fontFamily: font },

    // Colored sidebar
    sidebar: { width: '27%', backgroundColor: primary, padding: 28, flexDirection: 'column' },
    logo:    { width: 100, height: 68, objectFit: 'contain', marginBottom: 16 },
    senderName:     { fontSize: 14, fontFamily: bold, color: '#ffffff', marginBottom: 14, lineHeight: 1.3 },
    sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
    sidebarSection: { marginBottom: 14 },
    sidebarLabel:   { fontSize: 7.5, fontFamily: bold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    sidebarText:    { fontSize: 9, color: 'rgba(255,255,255,0.85)', marginBottom: 3, lineHeight: 1.4 },

    // Main content
    main:     { width: '73%', padding: 32 },
    titleRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    title:     { fontSize: 26, fontFamily: bold, color: primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    titleSub:  { fontSize: 9.5, color: '#64748b', marginBottom: 2.5 },
    clientBlock:{ alignItems: 'flex-end' },
    clientLabel:{ fontSize: 8, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    clientName: { fontSize: 13, fontFamily: bold, color: textColor, marginBottom: 3 },
    clientSub:  { fontSize: 9, color: '#64748b', marginBottom: 2 },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Sidebar */}
        <View style={s.sidebar}>
          {sender.logo ? <View style={{ alignSelf: logoAlign }}><PDFLogo src={sender.logo} theme={theme} baseWidth={100} baseHeight={68} /></View> : null}
          <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text>

          <View style={s.sidebarDivider} />

          {sender.address ? (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarLabel}>Indirizzo</Text>
              <Text style={s.sidebarText}>{sender.address}</Text>
              {(sender.city || sender.postalCode) ? (
                <Text style={s.sidebarText}>{sender.postalCode} {sender.city}</Text>
              ) : null}
              {sender.country ? <Text style={s.sidebarText}>{sender.country}</Text> : null}
            </View>
          ) : null}

          {sender.vatNumber ? (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarLabel}>P.IVA / C.F.</Text>
              <Text style={s.sidebarText}>{sender.vatNumber}</Text>
            </View>
          ) : null}

          {(sender.email || sender.phone) ? (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarLabel}>Contatti</Text>
              {sender.email ? <Text style={s.sidebarText}>{sender.email}</Text> : null}
              {sender.phone ? <Text style={s.sidebarText}>{sender.phone}</Text> : null}
            </View>
          ) : null}

          {sender.customFields && sender.customFields.length > 0 ? (
            <View style={s.sidebarSection}>
              {sender.customFields.map(f => (
                <Text key={f.id} style={s.sidebarText}>{f.label}: {f.value}</Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Main */}
        <View style={s.main}>
          <View style={s.titleRow}>
            {/* Quote info */}
            <View>
              <Text style={s.title}>Preventivo</Text>
              <Text style={s.titleSub}>#{quote.number}</Text>
              <Text style={s.titleSub}>Data: {formatDate(quote.createdAt)}</Text>
              <Text style={s.titleSub}>Validità: {quote.validityDays} giorni</Text>
            </View>
            {/* Client */}
            <View style={s.clientBlock}>
              <Text style={s.clientLabel}>Spettabile</Text>
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

          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
