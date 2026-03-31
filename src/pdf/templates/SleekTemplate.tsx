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

export const SleekTemplate = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const primary = theme.primaryColor ?? '#1a1a2e';
  const accent = theme.accentColor ?? '#e94560';
  const textColor = theme.textColor ?? '#1e293b';
  const logoPos = theme.logoPosition ?? 'left';

  const s = StyleSheet.create({
    page: {
      backgroundColor: '#ffffff',
      fontFamily: font,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      backgroundColor: primary,
      paddingTop: 28,
      paddingHorizontal: 40,
      paddingBottom: 0,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },

    // Logo / sender block (left)
    logoBlock: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
    senderName: {
      fontSize: 16,
      fontFamily: bold,
      color: '#ffffff',
      marginBottom: 4,
    },
    senderSub: {
      fontSize: 8.5,
      color: 'rgba(255,255,255,0.6)',
      marginBottom: 2,
      lineHeight: 1.4,
    },

    // Quote number block (right)
    quoteBlock: {
      alignItems: 'flex-end',
    },
    quoteBadge: {
      backgroundColor: accent,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 3,
      marginBottom: 8,
    },
    quoteBadgeText: {
      fontSize: 8,
      fontFamily: bold,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    quoteNumber: {
      fontSize: 22,
      fontFamily: bold,
      color: '#ffffff',
      marginBottom: 4,
    },
    quoteMeta: {
      fontSize: 8.5,
      color: 'rgba(255,255,255,0.55)',
      marginBottom: 2,
    },

    // Accent divider line below header top
    accentBar: {
      height: 3,
      backgroundColor: accent,
      marginBottom: 0,
    },

    // ── Client card ─────────────────────────────────────────────────────────
    clientCardWrapper: {
      paddingHorizontal: 40,
      paddingVertical: 0,
      // Card is pulled up to overlap the dark header
      marginTop: -1,
    },
    clientCard: {
      backgroundColor: '#ffffff',
      borderLeftWidth: 4,
      borderLeftColor: accent,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginTop: 16,
      marginBottom: 0,
    },
    clientLabel: {
      fontSize: 7.5,
      fontFamily: bold,
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 6,
    },
    clientName: {
      fontSize: 13,
      fontFamily: bold,
      color: textColor,
      marginBottom: 3,
    },
    clientSub: {
      fontSize: 8.5,
      color: '#64748b',
      marginBottom: 2,
      lineHeight: 1.4,
    },

    // ── Body ─────────────────────────────────────────────────────────────────
    body: {
      paddingHorizontal: 40,
      paddingTop: 20,
      paddingBottom: 40,
    },

    sectionDivider: {
      height: 1,
      backgroundColor: '#e2e8f0',
      marginBottom: 16,
    },
  });

  const senderBlock = (
    <View style={s.logoBlock}>
      {sender.logo ? (
        <PDFLogo src={sender.logo} theme={theme} baseWidth={160} baseHeight={60} />
      ) : (
        <Text style={s.senderName}>{sender.name || 'Nome Azienda'}</Text>
      )}
      {sender.logo && sender.name ? (
        <Text style={s.senderName}>{sender.name}</Text>
      ) : null}
      {sender.address ? <Text style={s.senderSub}>{sender.address}</Text> : null}
      {(sender.city || sender.postalCode) ? (
        <Text style={s.senderSub}>{sender.postalCode} {sender.city}</Text>
      ) : null}
      {sender.vatNumber ? <Text style={s.senderSub}>P.IVA {sender.vatNumber}</Text> : null}
      {sender.email ? <Text style={s.senderSub}>{sender.email}</Text> : null}
      {sender.phone ? <Text style={s.senderSub}>{sender.phone}</Text> : null}
    </View>
  );

  const quoteBlock = (
    <View style={s.quoteBlock}>
      <View style={s.quoteBadge}>
        <Text style={s.quoteBadgeText}>Preventivo</Text>
      </View>
      <Text style={s.quoteNumber}>#{quote.number}</Text>
      <Text style={s.quoteMeta}>Data: {formatDate(quote.createdAt)}</Text>
      <Text style={s.quoteMeta}>Validità: {quote.validityDays} giorni</Text>
    </View>
  );

  const headerTopContent = logoPos === 'right'
    ? <>{quoteBlock}{senderBlock}</>
    : <>{senderBlock}{quoteBlock}</>;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Dark header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            {headerTopContent}
          </View>
          <View style={s.accentBar} />
        </View>

        {/* Client card with colored left border */}
        <View style={s.clientCardWrapper}>
          <View style={s.clientCard}>
            <Text style={s.clientLabel}>Destinatario</Text>
            <Text style={s.clientName}>{client.name || 'Cliente'}</Text>
            {client.address ? <Text style={s.clientSub}>{client.address}</Text> : null}
            {(client.city || client.postalCode) ? (
              <Text style={s.clientSub}>
                {client.postalCode} {client.city}{client.country ? ` (${client.country})` : ''}
              </Text>
            ) : null}
            {client.vatNumber ? <Text style={s.clientSub}>P.IVA {client.vatNumber}</Text> : null}
            {client.email ? <Text style={s.clientSub}>{client.email}</Text> : null}
            {client.customFields?.map(f => (
              <Text key={f.id} style={s.clientSub}>{f.label}: {f.value}</Text>
            ))}
          </View>
        </View>

        {/* Body: table + footer */}
        <View style={s.body}>
          <PDFItemsTable quote={quote} />
          <PDFFooter quote={quote} />
        </View>
      </Page>
    </Document>
  );
};
