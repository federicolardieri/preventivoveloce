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

  const offsetStyle = {
    marginLeft: offsetX,
    marginTop: offsetY,
  };

  if (shape === 'circle' || shape === 'square') {
    return (
      <View style={{ width: 96, height: 96, ...offsetStyle, ...style }}>
        <Image src={src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </View>
    );
  }

  const w = baseWidth * scale;
  const h = baseHeight * scale;
  return (
    <Image src={src} style={{ width: w, height: h, objectFit: 'contain', ...offsetStyle, ...style }} />
  );
}
