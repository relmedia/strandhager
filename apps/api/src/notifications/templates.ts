/**
 * One shared layout for every email the association sends, so they all look
 * the same: the logo in the header, a heading, some paragraphs, and optionally
 * a small table of facts (dates, prices, references).
 */

const BRAND = '#3f9a28';
/** The website's sea blue, used for the "strandhager" half of the wordmark. */
const SEA = '#2f9fd0';
const INK = '#1f2a20';
const MUTED = '#5c6b5e';
const SAND = '#f4f6ef';

const SITE_URL = (process.env.WEB_URL ?? process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const LOGO_URL = `${SITE_URL}/images/logo.png`;
const FACEBOOK_URL = 'https://www.facebook.com/groups/820245121802789/?locale=nb_NO';
const INSTAGRAM_URL = 'https://www.instagram.com/strandhagene_parseller/';

/** Inset horizontal rule that matches the 32px content padding instead of spanning the card. */
const DIVIDER = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td style="height:1px;background:#e6eae2;font-size:0;line-height:1px;">&nbsp;</td></tr></table>`;

export type EmailContent = {
  heading: string;
  /** Paragraphs, in order. */
  lines: string[];
  /** Label/value rows shown as a small table under the paragraphs. */
  facts?: [string, string][];
  /** A one-time code shown large in its own box, e.g. a login code. */
  code?: string;
  /** Label above the code box. Defaults to "Kode". */
  codeLabel?: string;
  /** A button under the text, e.g. the guest's cancellation link. */
  action?: { label: string; url: string };
};

export function renderEmail({
  heading,
  lines,
  facts,
  code,
  codeLabel,
  action,
}: EmailContent): string {
  const paragraphs = lines
    .map(
      (line) =>
        `<p style="margin:0 0 14px;color:${INK};font-size:15px;line-height:1.6;">${escapeHtml(line)}</p>`,
    )
    .join('');

  const table = facts?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;width:100%;border-collapse:collapse;">
        ${facts
          .map(
            ([label, value]) => `<tr>
              <td style="padding:8px 14px 8px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:8px 0;color:${INK};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
            </tr>`,
          )
          .join('')}
      </table>`
    : '';

  const codeBox = code
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;width:100%;">
        <tr>
          <td align="center" style="padding:22px 16px;background:${SAND};border:1px solid #d5ddd0;border-radius:10px;">
            <p style="margin:0 0 8px;color:${MUTED};font-size:16px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(codeLabel ?? 'Kode')}</p>
            <p style="margin:0;color:${INK};font-size:${code.length <= 8 ? '36px' : '24px'};line-height:1.2;font-weight:700;letter-spacing:${code.length <= 8 ? '0.28em' : '0.06em'};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;word-break:break-all;">${escapeHtml(code)}</p>
          </td>
        </tr>
      </table>`
    : '';

  const button = action
    ? `<p style="margin:24px 0 6px;">
        <a href="${escapeAttribute(action.url)}"
           style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:6px;">
          ${escapeHtml(action.label)}
        </a>
      </p>`
    : '';

  return `<!doctype html>
<html lang="nb">
  <body style="margin:0;padding:0;background:${SAND};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${SAND};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:20px 32px;background:#ffffff;">
                <a href="${escapeAttribute(SITE_URL)}" style="text-decoration:none;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                      <td style="vertical-align:middle;padding-right:10px;">
                        <img
                          src="${escapeAttribute(LOGO_URL)}"
                          alt="Ølberg strandhager"
                          width="56"
                          height="38"
                          style="display:block;border:0;outline:none;height:auto;max-width:56px;"
                        />
                      </td>
                      <td style="vertical-align:middle;">
                        <span style="font-size:19px;line-height:1;font-weight:600;letter-spacing:0.04em;"><span style="color:${BRAND};">Ølberg</span><span style="color:${SEA};">strandhager</span></span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;background:#ffffff;">${DIVIDER}</td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 18px;color:${INK};font-size:21px;line-height:1.35;">${escapeHtml(heading)}</h1>
                ${paragraphs}
                ${codeBox}
                ${table}
                ${button}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">${DIVIDER}</td>
            </tr>
            <tr>
              <td style="padding:16px 32px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
                        Ølberg strandhager · Strandhagane 50, 4053 Ræge · strandhager.no
                      </p>
                    </td>
                    <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:12px;">
                      <a href="${escapeAttribute(FACEBOOK_URL)}" style="text-decoration:none;display:inline-block;vertical-align:middle;">
                        <img
                          src="${escapeAttribute(`${SITE_URL}/images/email/facebook.png`)}"
                          alt="Facebook"
                          width="20"
                          height="20"
                          style="display:block;border:0;outline:none;"
                        />
                      </a>
                      <a href="${escapeAttribute(INSTAGRAM_URL)}" style="text-decoration:none;display:inline-block;vertical-align:middle;margin-left:12px;">
                        <img
                          src="${escapeAttribute(`${SITE_URL}/images/email/instagram.png`)}"
                          alt="Instagram"
                          width="20"
                          height="20"
                          style="display:block;border:0;outline:none;"
                        />
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Plain-text fallback for clients that do not render HTML. */
export function renderText({
  heading,
  lines,
  facts,
  code,
  codeLabel,
  action,
}: EmailContent): string {
  const parts = [heading, '', ...lines];
  if (code) {
    parts.push('', `${codeLabel ?? 'Kode'}: ${code}`);
  }
  if (facts?.length) {
    parts.push('', ...facts.map(([label, value]) => `${label}: ${value}`));
  }
  if (action) {
    parts.push('', `${action.label}: ${action.url}`);
  }
  parts.push('', '— Ølberg strandhager');
  return parts.join('\n');
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-');
  return `${day}.${month}.${year}`;
}

export function formatPrice(amount: number): string {
  return `kr ${new Intl.NumberFormat('nb-NO').format(amount)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;');
}
