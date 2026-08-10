/**
 * One shared layout for every email the association sends, so they all look
 * the same: a green header, a heading, some paragraphs, and optionally a
 * small table of facts (dates, prices, references).
 */

const BRAND = '#3f9a28';
const BRAND_DEEP = '#2f7420';
const INK = '#1f2a20';
const MUTED = '#5c6b5e';
const SAND = '#f4f6ef';

export type EmailContent = {
  heading: string;
  /** Paragraphs, in order. */
  lines: string[];
  /** Label/value rows shown as a small table under the paragraphs. */
  facts?: [string, string][];
  /** A button under the text, e.g. the guest's cancellation link. */
  action?: { label: string; url: string };
};

export function renderEmail({ heading, lines, facts, action }: EmailContent): string {
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
              <td style="background:${BRAND_DEEP};padding:20px 32px;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.4px;">Ølberg strandhager</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 18px;color:${INK};font-size:21px;line-height:1.35;">${escapeHtml(heading)}</h1>
                ${paragraphs}
                ${table}
                ${button}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #e6eae2;">
                <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
                  Ølberg strandhager · Strandhagane 50, 4053 Ræge · strandhager.no
                </p>
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
export function renderText({ heading, lines, facts, action }: EmailContent): string {
  const parts = [heading, '', ...lines];
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
