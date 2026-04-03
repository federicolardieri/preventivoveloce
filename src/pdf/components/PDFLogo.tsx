import { View, Image } from '@react-pdf/renderer';
import { QuoteTheme } from '@/types/quote';

interface PDFLogoProps {
  src: string;
  theme: QuoteTheme;
  baseWidth?: number;
  baseHeight?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
}

export function PDFLogo({ src, theme, baseWidth = 220, baseHeight = 80, style = {} }: PDFLogoProps) {
  const shape = theme.logoShape ?? 'original';
  const scale = theme.logoScale ?? 1;
  const offsetX = theme.logoOffsetX ?? 0;
  const offsetY = theme.logoOffsetY ?? 0;

  // Offset applicato come margini espliciti solo se non zero
  const offset: Record<string, number> = {};
  if (offsetX !== 0) offset.marginLeft = offsetX;
  if (offsetY !== 0) offset.marginTop = offsetY;

  if (shape === 'circle' || shape === 'square') {
    // L'immagine è già ritagliata e modellata dal canvas in LogoUpload.
    // baseHeight viene usato come lato del container quadrato nel PDF.
    // Lo scale è già incorporato nell'immagine processata, quindi non lo riapplichiamo.
    const size = baseHeight * 1.5;
    return (
      <View style={{ width: size, height: size, ...offset, ...style }}>
        <Image src={src} style={{ width: size, height: size, objectFit: 'contain' }} />
      </View>
    );
  }

  // original: le dimensioni nel PDF sono baseWidth * scale × baseHeight * scale
  const w = baseWidth * scale;
  const h = baseHeight * scale;
  return (
    <Image src={src} style={{ width: w, height: h, objectFit: 'contain', ...offset, ...style }} />
  );
}
