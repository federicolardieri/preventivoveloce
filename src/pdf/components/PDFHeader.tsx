import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { Quote, FontFamily } from '@/types/quote';

function boldFont(family: FontFamily): string {
  if (family === 'Times-Roman') return 'Times-Bold';
  if (family === 'Courier') return 'Courier-Bold';
  return 'Helvetica-Bold';
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const PDFHeader = ({ quote }: { quote: Quote }) => {
  const { sender, client, theme } = quote;
  const font = theme.fontFamily ?? 'Helvetica';
  const bold = boldFont(font);
  const textColor = theme.textColor ?? '#1e293b';
  const primaryColor = theme.primaryColor ?? '#5c32e6';
  const logoPosition = theme.logoPosition ?? 'left';

  const styles = StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
    },
    leftColumn: {
      flexDirection: 'column',
      width: '45%',
    },
    rightColumn: {
      flexDirection: 'column',
      width: '45%',
      alignItems: logoPosition === 'right' ? 'flex-start' : 'flex-end',
    },
    logoContainer: {
      width: 80,
      height: 80,
      marginBottom: 10,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderRadius: theme.logoShape === 'circle' ? 40 : theme.logoShape === 'square' ? 8 : 0,
      backgroundColor: theme.logoShape !== 'original' ? '#f8fafc' : 'transparent',
    },
    logo: { 
      width: '100%',
      height: '100%',
      objectFit: theme.logoShape === 'original' ? 'contain' : 'cover', 
    },
    senderName: { fontSize: 16, fontFamily: bold, marginBottom: 4, color: textColor },
    subText: { fontSize: 10, fontFamily: font, color: '#64748b', marginBottom: 2, lineHeight: 1.4 },
    titleBlock: { marginBottom: 20, alignItems: logoPosition === 'right' ? 'flex-start' : 'flex-end' },
    title: { fontSize: 24, fontFamily: bold, color: primaryColor, textTransform: 'uppercase', letterSpacing: 1 },
    quoteNumber: { fontSize: 12, fontFamily: font, color: '#64748b', marginTop: 4 },
    clientBlock: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    clientLabel: { fontSize: 10, fontFamily: bold, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 },
    clientName: { fontSize: 14, fontFamily: bold, color: textColor, marginBottom: 4 },
  });

  // Con logoPosition='right': colonna sinistra ha titolo+cliente, colonna destra ha logo+mittente
  const isLogoRight = logoPosition === 'right';

  const senderContent = (
    <>
      {sender.logo ? (
        <View style={theme.logoShape !== 'original' ? styles.logoContainer : { marginBottom: 8 }}>
           <Image src={sender.logo} style={styles.logo} />
        </View>
      ) : (
        <Text style={styles.senderName}>{sender.name || 'Nome Azienda'}</Text>
      )}
      {sender.logo && <Text style={styles.senderName}>{sender.name}</Text>}
      {sender.address && <Text style={styles.subText}>{sender.address}</Text>}
      {(sender.city || sender.postalCode) && (
        <Text style={styles.subText}>
          {`${sender.postalCode || ''} ${sender.city || ''} ${sender.country ? `(${sender.country})` : ''}`}
        </Text>
      )}
      {sender.vatNumber && <Text style={styles.subText}>P.IVA/CF: {sender.vatNumber}</Text>}
      {sender.email && <Text style={styles.subText}>{sender.email}</Text>}
      {sender.phone && <Text style={styles.subText}>{sender.phone}</Text>}
      {sender.customFields?.map(f => (
        <Text key={f.id} style={styles.subText}>{f.label}: {f.value}</Text>
      ))}
    </>
  );

  const titleClientContent = (
    <>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Preventivo</Text>
        <Text style={styles.quoteNumber}>#{quote.number}</Text>
        <Text style={styles.subText}>Data: {formatDate(quote.createdAt)}</Text>
        <Text style={styles.subText}>Validità: {quote.validityDays} giorni</Text>
      </View>
      <View style={styles.clientBlock}>
        <Text style={styles.clientLabel}>Spettabile</Text>
        <Text style={styles.clientName}>{client.name || 'Cliente'}</Text>
        {client.address && <Text style={styles.subText}>{client.address}</Text>}
        {(client.city || client.postalCode) && (
          <Text style={styles.subText}>
            {`${client.postalCode || ''} ${client.city || ''} ${client.country ? `(${client.country})` : ''}`}
          </Text>
        )}
        {client.vatNumber && <Text style={styles.subText}>P.IVA/CF: {client.vatNumber}</Text>}
        {client.email && <Text style={styles.subText}>{client.email}</Text>}
        {client.customFields?.map(f => (
          <Text key={f.id} style={styles.subText}>{f.label}: {f.value}</Text>
        ))}
      </View>
    </>
  );

  return (
    <View style={styles.headerRow}>
      <View style={styles.leftColumn}>
        {isLogoRight ? titleClientContent : senderContent}
      </View>
      <View style={styles.rightColumn}>
        {isLogoRight ? senderContent : titleClientContent}
      </View>
    </View>
  );
};
