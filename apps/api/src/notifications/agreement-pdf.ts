import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from 'pdf-lib';

/**
 * Renders the rental agreement as a PDF, styled like the dashboard's booking
 * document: the logo letterhead, the two parties in bordered cards, the
 * rental facts in a grid, the full rental terms with the booking's values
 * filled in, and both signatures — the guest's hand-drawn one and the
 * board's electronic confirmation. Attached to the confirmation e-mail so
 * the guest keeps a complete copy of what was agreed.
 */
export type AgreementData = {
  reference: string;
  spaceName: string;
  maxGuests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCompany: string | null;
  /** ISO dates, both inclusive. */
  startDate: string;
  endDate: string;
  days: number;
  guests: number;
  purpose: string | null;
  dayTotal: number;
  cleaningFee: number;
  total: number;
  /** The guest's drawn signature as a data URL, when they signed. */
  signature: string | null;
  termsAcceptedAt: Date | null;
  confirmedAt: Date;
  confirmedByName: string | null;
};

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

// A4 in points.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 64;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

// The dashboard document's neutral palette.
const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.45, 0.45, 0.45);
const LINE = rgb(0.898, 0.898, 0.898);
const FOOT_BG = rgb(0.98, 0.98, 0.98);

const LANDLORD = {
  name: 'Ølberg strandhager ved hagestyret',
  lines: ['felleshuset@strandhager.no', '957 82 508'],
};

export async function renderAgreementPdf(data: AgreementData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Leieavtale ${data.reference} – ${data.spaceName}`);
  doc.setAuthor('Ølberg strandhager');

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  const [logo, signatureImage] = await Promise.all([
    fetchLogo(doc),
    embedSignature(doc, data.signature),
  ]);

  const writer = new Writer(doc, fonts);

  writer.letterhead(data.reference, logo);

  // 1. Partene ------------------------------------------------------------
  writer.sectionHeading('1. Partene');
  writer.parties(
    { label: 'Utleier', name: LANDLORD.name, lines: LANDLORD.lines },
    {
      label: 'Leietaker',
      name: data.guestName,
      lines: [data.guestCompany, data.guestEmail, data.guestPhone].filter(
        (line): line is string => Boolean(line),
      ),
    },
  );

  // 2. Lokalet og leieperioden ----------------------------------------------
  writer.sectionHeading('2. Lokalet og leieperioden');
  writer.facts([
    ['Lokale', data.spaceName],
    ['Fra', formatFullDate(data.startDate)],
    ['Til', formatFullDate(data.endDate)],
    ['Antall dager', String(data.days)],
    ['Antall gjester', String(data.guests)],
    ['Anledning', data.purpose ?? '—'],
  ]);
  writer.paragraph(
    `Leien gjelder ${data.spaceName} ved Ølberg strandhager, Ølberg i Sola kommune. Lokalet overtas om morgenen første leiedag og forlates ryddet innen kl. 22.00 siste leiedag, med mindre annet er avtalt med utleier.`,
  );

  // 3. Pris og betaling -------------------------------------------------------
  writer.sectionHeading('3. Pris og betaling');
  writer.priceLine(`Leie, ${data.days} ${data.days === 1 ? 'dag' : 'dager'}`, data.dayTotal);
  if (data.cleaningFee > 0) {
    writer.priceLine('Utvask', data.cleaningFee);
  }
  writer.priceTotal('Totalt inkl. mva.', data.total);
  writer.paragraph(
    'Betaling skjer etter at bookingen er bekreftet av utleier, med frist som oppgitt på fakturaen.',
  );

  // 4–7. The standing terms ---------------------------------------------------
  writer.sectionHeading('4. Bekreftelse og avbestilling');
  writer.paragraph(
    'Forespørselen er ikke bindende før den er bekreftet av utleier. Fra bekreftelsen er bookingen bindende for begge parter.',
  );
  writer.paragraph(
    'Bookingen kan avbestilles kostnadsfritt inntil 14 dager før første leiedag. Ved avbestilling senere enn dette kan utleier fakturere inntil 50 % av leiesummen.',
  );

  writer.sectionHeading('5. Bruk av lokalet');
  writer.paragraph(
    `Lokalet har plass til inntil ${data.maxGuests} personer, og antallet gjester skal ikke overstige dette.`,
  );
  writer.paragraph(
    'Leietaker plikter å rydde og grovrengjøre lokalet etter bruk. Utvasken som er inkludert i prisen dekker hovedrengjøringen.',
  );
  writer.paragraph(
    'Av hensyn til naboene skal det holdes ro utendørs etter kl. 23.00. Røyking er ikke tillatt innendørs.',
  );

  writer.sectionHeading('6. Skader og ansvar');
  writer.paragraph(
    'Leietaker er erstatningsansvarlig for skade som påføres bygningen, inventaret eller utstyret i leieperioden. Skader skal meldes til utleier umiddelbart.',
  );

  writer.sectionHeading('7. Aldersgrense');
  writer.paragraph(
    'Leietaker må være fylt 18 år og være til stede under hele arrangementet.',
  );

  // 8. Elektronisk aksept ------------------------------------------------------
  writer.sectionHeading('8. Elektronisk aksept');
  writer.paragraph(
    `Avtalen er inngått elektronisk. Leietaker signerte leievilkårene og sendte bookingforespørselen${
      data.termsAcceptedAt ? ` ${formatTimestamp(data.termsAcceptedAt)}` : ''
    }, og utleier bekreftet bookingen ${formatTimestamp(data.confirmedAt)}. Signaturene og tidspunktene er lagret sammen med bookingen.`,
  );

  // Signatures -----------------------------------------------------------------
  writer.signatures({
    guest: {
      image: signatureImage,
      name: data.guestName,
      note: data.termsAcceptedAt
        ? `Signert elektronisk ${formatTimestamp(data.termsAcceptedAt)}`
        : 'Signert elektronisk',
    },
    landlord: {
      signedBy: data.confirmedByName,
      name: LANDLORD.name,
      note: `Bekreftet elektronisk ${formatTimestamp(data.confirmedAt)}`,
    },
  });

  writer.summaryStrip(
    `Forespørselen ble sendt inn${
      data.termsAcceptedAt
        ? `, og leievilkårene for ${data.spaceName} ble godtatt ${formatTimestamp(data.termsAcceptedAt)}`
        : ''
    }. Avtalen følger leievilkårene på strandhager.no.`,
  );

  writer.footers(data.reference);

  return Buffer.from(await doc.save());
}

/** The site logo for the letterhead; skipped rather than failing the PDF. */
async function fetchLogo(doc: PDFDocument): Promise<PDFImage | null> {
  try {
    const response = await fetch(`${WEB_URL}/images/logo.png`);
    if (!response.ok) return null;
    return await doc.embedPng(new Uint8Array(await response.arrayBuffer()));
  } catch {
    return null;
  }
}

/** The guest's drawing is a canvas data URL — PNG in practice, JPEG just in case. */
async function embedSignature(
  doc: PDFDocument,
  dataUrl: string | null,
): Promise<PDFImage | null> {
  if (!dataUrl) return null;

  const match = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;

  try {
    const bytes = Buffer.from(match[2], 'base64');
    return match[1] === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  } catch {
    // A corrupt signature should not stop the agreement from being sent.
    return null;
  }
}

// --- Layout -------------------------------------------------------------------

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

type PartyBlock = { label: string; name: string; lines: string[] };

class Writer {
  private page: PDFPage;
  private y: number;

  constructor(
    private readonly doc: PDFDocument,
    private readonly fonts: Fonts,
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }

  letterhead(reference: string, logo: PDFImage | null) {
    const { bold, regular } = this.fonts;
    const top = this.y;

    let x = MARGIN_X;
    if (logo) {
      const height = 26;
      const width = (logo.width / logo.height) * height;
      this.page.drawImage(logo, { x, y: top - height + 3, width, height });
      x += width + 10;
    }

    this.page.drawText('Ølberg strandhager', {
      x,
      y: top - 12,
      size: 12,
      font: bold,
      color: INK,
    });
    this.page.drawText('Strandhagane 50, 4053 Ræge · strandhager.no', {
      x,
      y: top - 24,
      size: 8,
      font: regular,
      color: MUTED,
    });

    const title = 'Leieavtale';
    const titleWidth = bold.widthOfTextAtSize(title, 14);
    this.page.drawText(title, {
      x: PAGE_WIDTH - MARGIN_X - titleWidth,
      y: top - 12,
      size: 14,
      font: bold,
      color: INK,
    });
    const ref = `Referanse ${reference}`;
    const refWidth = regular.widthOfTextAtSize(ref, 8);
    this.page.drawText(ref, {
      x: PAGE_WIDTH - MARGIN_X - refWidth,
      y: top - 24,
      size: 8,
      font: regular,
      color: MUTED,
    });

    this.y = top - 40;
    this.rule();
    this.y -= 8;
  }

  sectionHeading(text: string) {
    this.ensure(44);
    this.y -= 16;
    this.tracked(text.toUpperCase(), MARGIN_X, this.y, 8, this.fonts.bold, MUTED, 1.1);
    this.y -= 15;
  }

  paragraph(text: string) {
    const size = 9.5;
    const lineHeight = 13.5;
    const lines = wrap(text, this.fonts.regular, size, CONTENT_WIDTH);

    for (const line of lines) {
      this.ensure(lineHeight);
      this.page.drawText(line, {
        x: MARGIN_X,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= lineHeight;
    }
    this.y -= 4;
  }

  /** The two parties in bordered cards, side by side like on the dashboard. */
  parties(left: PartyBlock, right: PartyBlock) {
    const gap = 12;
    const cardWidth = (CONTENT_WIDTH - gap) / 2;
    const pad = 11;
    const lineCount = Math.max(left.lines.length, right.lines.length);
    const cardHeight = pad + 9 + 15 + lineCount * 12 + pad - 2;
    this.ensure(cardHeight + 6);

    const top = this.y;
    for (const [index, block] of [left, right].entries()) {
      const cardX = MARGIN_X + index * (cardWidth + gap);

      this.page.drawRectangle({
        x: cardX,
        y: top - cardHeight,
        width: cardWidth,
        height: cardHeight,
        borderColor: LINE,
        borderWidth: 0.9,
      });

      let y = top - pad - 7;
      this.tracked(block.label.toUpperCase(), cardX + pad, y, 7.5, this.fonts.bold, MUTED, 1);
      y -= 15;
      this.page.drawText(block.name, {
        x: cardX + pad,
        y,
        size: 9.5,
        font: this.fonts.bold,
        color: INK,
      });
      for (const line of block.lines) {
        y -= 12;
        this.page.drawText(line, {
          x: cardX + pad,
          y,
          size: 9,
          font: this.fonts.regular,
          color: MUTED,
        });
      }
    }

    this.y = top - cardHeight - 6;
  }

  /** Label-above-value cells in three columns, like the dashboard grid. */
  facts(rows: [string, string][]) {
    const columns = 3;
    const cellWidth = CONTENT_WIDTH / columns;
    const cellHeight = 26;

    for (let start = 0; start < rows.length; start += columns) {
      this.ensure(cellHeight);
      const top = this.y;

      for (const [offset, [label, value]] of rows.slice(start, start + columns).entries()) {
        const x = MARGIN_X + offset * cellWidth;
        this.page.drawText(label, {
          x,
          y: top - 7,
          size: 7.5,
          font: this.fonts.regular,
          color: MUTED,
        });
        this.page.drawText(value, {
          x,
          y: top - 19,
          size: 9.5,
          font: this.fonts.regular,
          color: INK,
        });
      }

      this.y = top - cellHeight - 4;
    }
    this.y -= 2;
  }

  priceLine(label: string, amount: number) {
    this.ensure(14);
    this.drawPriceRow(label, amount, this.fonts.regular, MUTED);
    this.y -= 14;
  }

  priceTotal(label: string, amount: number) {
    this.ensure(20);
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y + 10 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: this.y + 10 },
      thickness: 0.75,
      color: LINE,
    });
    this.drawPriceRow(label, amount, this.fonts.bold, INK);
    this.y -= 18;
  }

  private drawPriceRow(label: string, amount: number, font: PDFFont, color: RGB) {
    const size = 9.5;
    this.page.drawText(label, { x: MARGIN_X, y: this.y, size, font, color });

    const value = formatKroner(amount);
    const width = font.widthOfTextAtSize(value, size);
    this.page.drawText(value, {
      x: PAGE_WIDTH - MARGIN_X - width,
      y: this.y,
      size,
      font,
      color,
    });
  }

  signatures(blocks: {
    guest: { image: PDFImage | null; name: string; note: string };
    landlord: { signedBy: string | null; name: string; note: string };
  }) {
    const gap = 32;
    const columnWidth = (CONTENT_WIDTH - gap) / 2;
    // Keep the whole block together on one page: rule, headings, area, lines.
    this.ensure(170);

    this.y -= 12;
    this.rule();
    this.y -= 22;

    const headingY = this.y;
    const areaHeight = 44;
    const baseline = headingY - 14 - areaHeight;

    for (const [index, label] of ['Leietaker', 'Utleier'].entries()) {
      this.tracked(
        label.toUpperCase(),
        MARGIN_X + index * (columnWidth + gap),
        headingY,
        8,
        this.fonts.bold,
        MUTED,
        1.1,
      );
    }

    // Guest column: the drawn signature above the line.
    if (blocks.guest.image) {
      const scale = Math.min(
        areaHeight / blocks.guest.image.height,
        columnWidth / blocks.guest.image.width,
      );
      this.page.drawImage(blocks.guest.image, {
        x: MARGIN_X,
        y: baseline + 4,
        width: blocks.guest.image.width * scale,
        height: blocks.guest.image.height * scale,
      });
    }

    // Landlord column: the confirmer's name set in italics as the signature.
    if (blocks.landlord.signedBy) {
      this.page.drawText(blocks.landlord.signedBy, {
        x: MARGIN_X + columnWidth + gap,
        y: baseline + 10,
        size: 14,
        font: this.fonts.italic,
        color: INK,
      });
    }

    for (const [index, block] of [
      { name: blocks.guest.name, note: blocks.guest.note },
      { name: blocks.landlord.name, note: blocks.landlord.note },
    ].entries()) {
      const x = MARGIN_X + index * (columnWidth + gap);

      this.page.drawLine({
        start: { x, y: baseline },
        end: { x: x + columnWidth, y: baseline },
        thickness: 0.7,
        color: rgb(0.62, 0.62, 0.62),
      });
      this.page.drawText(block.name, {
        x,
        y: baseline - 13,
        size: 9,
        font: this.fonts.bold,
        color: INK,
      });
      this.page.drawText(block.note, {
        x,
        y: baseline - 25,
        size: 8,
        font: this.fonts.regular,
        color: MUTED,
      });
    }

    this.y = baseline - 38;
  }

  /** The light closing strip from the dashboard document. */
  summaryStrip(text: string) {
    const size = 8;
    const lineHeight = 11.5;
    const pad = 12;
    const lines = wrap(text, this.fonts.regular, size, CONTENT_WIDTH - pad * 2);
    const height = pad * 2 + lines.length * lineHeight - 3;
    this.ensure(height + 4);

    const top = this.y;
    this.page.drawRectangle({
      x: MARGIN_X,
      y: top - height,
      width: CONTENT_WIDTH,
      height,
      color: FOOT_BG,
      borderColor: LINE,
      borderWidth: 0.9,
    });

    let y = top - pad - 6;
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN_X + pad,
        y,
        size,
        font: this.fonts.regular,
        color: MUTED,
      });
      y -= lineHeight;
    }

    this.y = top - height - 8;
  }

  /** Reference and page number at the foot of every page. */
  footers(reference: string) {
    const pages = this.doc.getPages();
    for (const [index, page] of pages.entries()) {
      const text = `Leieavtale ${reference} · Ølberg strandhager · side ${index + 1} av ${pages.length}`;
      const width = this.fonts.regular.widthOfTextAtSize(text, 7.5);
      page.drawText(text, {
        x: (PAGE_WIDTH - width) / 2,
        y: MARGIN_BOTTOM / 2,
        size: 7.5,
        font: this.fonts.regular,
        color: MUTED,
      });
    }
  }

  /** Uppercase letter-spaced captions, matching the dashboard's tracked headings. */
  private tracked(
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color: RGB,
    tracking: number,
  ) {
    let cx = x;
    for (const char of text) {
      this.page.drawText(char, { x: cx, y, size, font, color });
      cx += font.widthOfTextAtSize(char, size) + tracking;
    }
  }

  private rule() {
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: this.y },
      thickness: 0.9,
      color: LINE,
    });
  }

  private ensure(height: number) {
    if (this.y - height >= MARGIN_BOTTOM) return;
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines;
}

// --- Formatting -----------------------------------------------------------------

function formatKroner(amount: number): string {
  // Intl may group with (narrow) no-break spaces, which WinAnsi cannot encode.
  const grouped = new Intl.NumberFormat('nb-NO').format(amount).replace(/[\u00a0\u202f]/g, ' ');
  return `${grouped} kr`;
}

const FULL_DATE = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const TIMESTAMP = new Intl.DateTimeFormat('nb-NO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Oslo',
});

/** Intl sometimes uses (narrow) no-break spaces, which WinAnsi cannot encode. */
function plainSpaces(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, ' ');
}

function formatFullDate(iso: string): string {
  return plainSpaces(FULL_DATE.format(new Date(`${iso}T12:00:00Z`)));
}

function formatTimestamp(date: Date): string {
  return plainSpaces(TIMESTAMP.format(date));
}
