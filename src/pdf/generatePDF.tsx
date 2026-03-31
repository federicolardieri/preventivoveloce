import { renderToStream } from '@react-pdf/renderer';
import { Quote } from '@/types/quote';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { BoldTemplate } from './templates/BoldTemplate';
import { CorporateTemplate } from './templates/CorporateTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { CoverPageTemplate } from './templates/CoverPageTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';

export async function generatePDF(quote: Quote): Promise<NodeJS.ReadableStream> {
  let template;

  switch (quote.template) {
    case 'modern':
      template = <ModernTemplate quote={quote} />;
      break;
    case 'minimal':
      template = <MinimalTemplate quote={quote} />;
      break;
    case 'bold':
      template = <BoldTemplate quote={quote} />;
      break;
    case 'corporate':
      template = <CorporateTemplate quote={quote} />;
      break;
    case 'creative':
      template = <CreativeTemplate quote={quote} />;
      break;
    case 'cover-page':
      template = <CoverPageTemplate quote={quote} />;
      break;
    case 'executive':
      template = <ExecutiveTemplate quote={quote} />;
      break;
    case 'classic':
    default:
      template = <ClassicTemplate quote={quote} />;
      break;
  }

  // renderToStream returns a standard Node.js stream
  return await renderToStream(template);
}
