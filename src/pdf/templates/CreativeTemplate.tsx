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

// ─── Creative Template ───────────────────────────────────────────────────────
// Design: "Agency Split" — colonna sinistra colorata (32%) con logo e info
// mittente su sfondo primary, colonna destra bianca (68%) con titolo grande,
// numero, info cliente. Stile studio creativo / agenzia.
// ─────────────────────────────────────────────────────────────────────────────

export const CreativeTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent  = theme.accentColor  ?? '#1d4ed8';
  const text    = theme.textColor    ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  // Larghezza pagina utile: 595pt, layout full-bleed (nessun padding pagina)
  const SIDEBAR_W = '32%';
  const MAIN_W    = '68%';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font, flexDirection: 'row' },

    // Colonna sinistra colorata (full-height)
    sidebar: {
      width: SIDEBAR_W, backgroundColor: primary,
      padding: 28, flexDirection: 'column', justifyContent: 'space-between',
      minHeight: '100%',
    },
    sidebarTop: {},
    sidebarLogo: { marginBottom: 20 },
    senderName: { fontSize: 13, fontFamily: bold, color: '#ffffff', marginBottom: 10, lineHeight: 1.3 },
    sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
    sidebarSection: { marginBottom: 14 },
    sidebarLabel: {
      fontSize: 7, fontFamily: bold, color: accent,
      textTransform: 'uppercase', letterSpacing: 2, marginBottom: 5,
      opacity: accent === primary ? 0.6 : 1,
    },
    sidebarText: { fontSize: 8.5, color: 'rgba(255,255,255,0.75)', marginBottom: 2.5, lineHeight: 1.4 },

    // Accent strip in fondo alla sidebar
    sidebarBottom: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      padding: 12, marginTop: 12,
    },
    sidebarBottomLabel: { fontSize: 7, fontFamily: bold, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    sidebarBottomValue: { fontSize: 10, fontFamily: bold, color: '#ffffff' },

    // Colonna destra (contenuto principale)
    main: { width: MAIN_W, padding: 36, flexDirection: 'column' },

    // Titolo grande
    mainEyebrow: {
      fontSize: 8, fontFamily: bold, color: accent,
      textTransform: 'uppercase', letterSpacing: 3, marginBottom: 10,
    },
    mainTitle: {
      fontSize: 36, fontFamily: bold, color: text,
      lineHeight: 1, letterSpacing: -1, marginBottom: 4,
    },
    mainAccentLine: {
      height: 4, width: 48, backgroundColor: accent,
      marginBottom: 16, borderRadius: 2,
    },
    mainNum: { fontSize: 12, fontFamily: bold, color: primary, marginBottom: 3 },
    mainDate: { fontSize: 8.5, color: '#94a3b8', marginBottom: 2 },

    // Info cliente
    clientSection: { marginTop: 20, marginBottom: 20 },
    clientLabel: { fontSize: 7.5, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 7 },
    clientName:  { fontSize: 14, fontFamily: bold, color: text, marginBottom: 4 },
    clientSub:   { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    // Separatore prima della tabella
    tableSep: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 16 },
  });

  const logoEl = sender.logo
    ? <PDFLogo src={sender.logo} theme={theme} baseWidth={130} baseHeight={52} />
    : null;

  // Se logoPos=center, mettiamo il logo in cima alla sidebar centrato
  const sidebarLogoEl = logoPos === 'center'
    ? (logoEl ? <View style={{ alignItems: 'center', marginBottom: 20 }}>{logoEl}</View> : null)
    : (logoEl ? <View style={s.sidebarLogo}>{logoEl}</View> : null);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Sidebar sinistra ── */}
        <View style={s.sidebar}>
          <View style={s.sidebarTop}>
            {sidebarLogoEl}
            <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text>
            <View style={s.sidebarDivider} />

            {sender.address ? (
              <View style={s.sidebarSection}>
                <Text style={s.sidebarLabel}>Indirizzo</Text>
                <Text style={s.sidebarText}>{sender.address}</Text>
                {(sender.city || sender.postalCode) && (
                  <Text style={s.sidebarText}>{sender.postalCode} {sender.city}</Text>
                )}
              </View>
            ) : null}

            {sender.vatNumber ? (
              <View style={s.sidebarSection}>
                <Text style={s.sidebarLabel}>P.IVA</Text>
                <Text style={s.sidebarText}>{sender.vatNumber}</Text>
              </View>
            ) : null}

            {(sender.email || sender.phone) ? (
              <View style={s.sidebarSection}>
                <Text style={s.sidebarLabel}>Contatti</Text>
                {sender.email && <Text style={s.sidebarText}>{sender.email}</Text>}
                {sender.phone && <Text style={s.sidebarText}>{sender.phone}</Text>}
              </View>
            ) : null}

            {sender.customFields && sender.customFields.length > 0 && (
              <View style={s.sidebarSection}>
                {sender.customFields.map(f => (
                  <Text key={f.id} style={s.sidebarText}>{f.label}: {f.value}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Bottom: data e validità */}
          <View style={s.sidebarBottom}>
            <Text style={s.sidebarBottomLabel}>Data</Text>
            <Text style={s.sidebarBottomValue}>{formatDate(quote.createdAt)}</Text>
            <Text style={[s.sidebarBottomLabel, { marginTop: 8 }]}>Validità</Text>
            <Text style={s.sidebarBottomValue}>{quote.validityDays} giorni</Text>
          </View>
        </View>

        {/* ── Colonna destra ── */}
        <View style={s.main}>
          <Text style={s.mainEyebrow}>Offerta Commerciale</Text>
          <Text style={s.mainTitle}>Preventivo.</Text>
          <View style={s.mainAccentLine} />
          <Text style={s.mainNum}>N° {quote.number}</Text>

          <View style={s.clientSection}>
            <Text style={s.clientLabel}>Preparato per</Text>
            <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
            {client.address && <Text style={s.clientSub}>{client.address}</Text>}
            {(client.city || client.postalCode) && (
              <Text style={s.clientSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
            )}
            {client.vatNumber && <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text>}
            {client.email && <Text style={s.clientSub}>{client.email}</Text>}
            {client.customFields?.map(f => <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>)}
          </View>

          <View style={s.tableSep} />
          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
