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

// ─── Bold Template ───────────────────────────────────────────────────────────
// Design: "Impact Header" — fascia orizzontale colorata di 110pt in cima.
// "PREVENTIVO" in caratteri enormi bianchi nella fascia (sinistra),
// numero preventivo e logo a destra. Sotto la fascia: mittente e cliente
// su due colonne affiancate. Corpo con tabella su sfondo bianco.
// ─────────────────────────────────────────────────────────────────────────────

export const BoldTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#5c32e6';
  const accent  = theme.accentColor  ?? primary;
  const text    = theme.textColor    ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: font },

    // Fascia hero
    hero: {
      backgroundColor: primary,
      paddingHorizontal: 40,
      paddingTop: 28,
      paddingBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    heroLeft: { flexDirection: 'column', justifyContent: 'flex-end' },
    heroTitle: {
      fontSize: 42, fontFamily: bold, color: '#ffffff',
      lineHeight: 1, letterSpacing: -1,
    },
    heroSubAccent: {
      height: 4, backgroundColor: accent, width: 48,
      marginTop: 8, marginBottom: 0, borderRadius: 2,
      opacity: accent === primary ? 0.4 : 1,
    },
    heroRight: { alignItems: 'flex-end' },
    heroNum: { fontSize: 18, fontFamily: bold, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
    heroMeta: { fontSize: 8.5, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },

    // Striscia info: mittente + cliente affiancati
    infoStrip: {
      flexDirection: 'row',
      backgroundColor: '#f8fafc',
      borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
      paddingHorizontal: 40, paddingVertical: 18,
      gap: 0,
    },
    infoCol: { width: '50%' },
    infoColBorder: { width: '50%', borderLeftWidth: 1, borderLeftColor: '#e2e8f0', paddingLeft: 32 },
    infoLabel: { fontSize: 7.5, fontFamily: bold, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
    infoName:  { fontSize: 11, fontFamily: bold, color: text, marginBottom: 3 },
    infoSub:   { fontSize: 8.5, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },

    // Corpo
    body: { paddingHorizontal: 40, paddingTop: 24, paddingBottom: 36 },
  });

  const logoEl = sender.logo
    ? <PDFLogo src={sender.logo} theme={theme} baseWidth={160} baseHeight={56} />
    : null;

  const heroRight = (
    <View style={s.heroRight}>
      {logoPos !== 'center' && logoEl}
      <Text style={[s.heroNum, logoEl ? { marginTop: 8 } : {}]}>#{quote.number}</Text>
      <Text style={s.heroMeta}>{formatDate(quote.createdAt)}</Text>
      <Text style={s.heroMeta}>Valido {quote.validityDays} giorni</Text>
    </View>
  );

  const heroLeft = (
    <View style={s.heroLeft}>
      <Text style={s.heroTitle}>PREVENTIVO.</Text>
      <View style={s.heroSubAccent} />
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Fascia hero */}
        {logoPos === 'center' && logoEl && (
          <View style={{ backgroundColor: primary, alignItems: 'center', paddingTop: 24, paddingBottom: 4 }}>
            {logoEl}
          </View>
        )}
        <View style={[s.hero, logoPos === 'right' ? { flexDirection: 'row-reverse' } : {}]}>
          {heroLeft}
          {heroRight}
        </View>

        {/* Strip info mittente + cliente */}
        <View style={s.infoStrip}>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Mittente</Text>
            <Text style={s.infoName}>{sender.name || 'Nome Azienda'}</Text>
            {sender.address && <Text style={s.infoSub}>{sender.address}</Text>}
            {(sender.city || sender.postalCode) && (
              <Text style={s.infoSub}>{sender.postalCode} {sender.city}</Text>
            )}
            {sender.vatNumber && <Text style={s.infoSub}>P.IVA {sender.vatNumber}</Text>}
            {sender.email && <Text style={s.infoSub}>{sender.email}</Text>}
            {sender.phone && <Text style={s.infoSub}>{sender.phone}</Text>}
            {sender.customFields?.map(f => <Text key={f.id} style={s.infoSub}>{f.label}: {f.value}</Text>)}
          </View>
          <View style={s.infoColBorder}>
            <Text style={[s.infoLabel, { color: text }]}>Destinatario</Text>
            <Text style={s.infoName}>{client.name || 'Cliente'}</Text>
            {client.address && <Text style={s.infoSub}>{client.address}</Text>}
            {(client.city || client.postalCode) && (
              <Text style={s.infoSub}>{client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}</Text>
            )}
            {client.vatNumber && <Text style={s.infoSub}>P.IVA {client.vatNumber}</Text>}
            {client.email && <Text style={s.infoSub}>{client.email}</Text>}
            {client.customFields?.map(f => <Text key={f.id} style={s.infoSub}>{f.label}: {f.value}</Text>)}
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
