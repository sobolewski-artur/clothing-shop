import type { OrderStatus, StoredOrder } from '#shared/types/orders'

// Email texts live here (not in i18n/locales) because emails are rendered on the server.
const copy = {
  pl: {
    shop: 'Clothing Store',
    subject: (n: string) => `Potwierdzenie zamówienia ${n}`,
    greeting: (name: string) => `Dzień dobry ${name},`,
    intro: 'dziękujemy za zamówienie! Poniżej znajdziesz jego podsumowanie.',
    number: 'Numer zamówienia',
    date: 'Data',
    product: 'Produkt',
    size: 'Rozmiar',
    oneSize: 'Rozmiar uniwersalny',
    quantity: 'Ilość',
    price: 'Wartość',
    subtotal: 'Wartość produktów',
    shipping: 'Dostawa',
    free: 'Gratis',
    total: 'Razem',
    delivery: 'Adres dostawy',
    notes: 'Uwagi',
    payment: 'Płatność',
    transfer: 'Przelew tradycyjny',
    cod: 'Płatność przy odbiorze',
    transferInfo: 'Wyślemy zamówienie po zaksięgowaniu wpłaty. Dane do przelewu:',
    transferLater: 'Wkrótce prześlemy numer konta do przelewu.',
    amount: 'Kwota',
    title: 'Tytuł przelewu',
    recipient: 'Odbiorca',
    account: 'Numer konta',
    codInfo: (amount: string) => `Zapłacisz ${amount} kurierowi przy odbiorze paczki.`,
    footer: 'Masz pytania? Odpowiedz na tę wiadomość i podaj numer zamówienia.'
  },
  en: {
    shop: 'Clothing Store',
    subject: (n: string) => `Order confirmation ${n}`,
    greeting: (name: string) => `Hello ${name},`,
    intro: 'thank you for your order! Here is your summary.',
    number: 'Order number',
    date: 'Date',
    product: 'Product',
    size: 'Size',
    oneSize: 'One size',
    quantity: 'Qty',
    price: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    free: 'Free',
    total: 'Total',
    delivery: 'Delivery address',
    notes: 'Notes',
    payment: 'Payment',
    transfer: 'Bank transfer',
    cod: 'Cash on delivery',
    transferInfo: 'We ship your order once the payment arrives. Transfer details:',
    transferLater: 'We\'ll send you our bank account details shortly.',
    amount: 'Amount',
    title: 'Transfer title',
    recipient: 'Recipient',
    account: 'Account number',
    codInfo: (amount: string) => `You'll pay ${amount} to the courier when your parcel arrives.`,
    footer: 'Questions? Just reply to this email and include your order number.'
  }
}

export interface BankDetails {
  bankAccount: string
  bankRecipient: string
}

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#39;')

/** Renders the customer's order confirmation as subject, plain text and HTML. */
export function renderOrderConfirmation(order: StoredOrder, bank: BankDetails) {
  const c = copy[order.locale]
  const money = (value: number) =>
    new Intl.NumberFormat(order.locale, { style: 'currency', currency: order.currency }).format(value)
  const date = new Intl.DateTimeFormat(order.locale, {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Warsaw'
  }).format(new Date(order.createdAt))
  // "Rozmiar: M", but just "Rozmiar uniwersalny" for one-size products.
  const size = (value: string) => (value === 'ONE' ? c.oneSize : `${c.size}: ${value}`)
  const { customer } = order
  const shipping = order.shipping ? money(order.shipping) : c.free
  const address = [customer.name, customer.street, `${customer.postalCode} ${customer.city}`, customer.phone, customer.email]

  const paymentLines: [string, string][] = order.customer.payment === 'transfer'
    ? [
        [c.amount, money(order.total)],
        [c.title, order.number],
        ...(bank.bankAccount && bank.bankRecipient ? [[c.recipient, bank.bankRecipient] as [string, string]] : []),
        ...(bank.bankAccount ? [[c.account, bank.bankAccount] as [string, string]] : [])
      ]
    : []
  const paymentIntro = order.customer.payment === 'transfer'
    ? (bank.bankAccount ? c.transferInfo : c.transferLater)
    : c.codInfo(money(order.total))

  // Plain text version
  const text = [
    c.greeting(customer.name),
    c.intro,
    '',
    `${c.number}: ${order.number}`,
    `${c.date}: ${date}`,
    '',
    ...order.items.map(item => `- ${item.name} (${size(item.size)}) × ${item.quantity}: ${money(item.total)}`),
    '',
    `${c.subtotal}: ${money(order.subtotal)}`,
    `${c.shipping}: ${shipping}`,
    `${c.total}: ${money(order.total)}`,
    '',
    `${c.payment}: ${c[customer.payment]}`,
    paymentIntro,
    ...paymentLines.map(([label, value]) => `${label}: ${value}`),
    '',
    `${c.delivery}:`,
    ...address,
    ...(customer.notes ? ['', `${c.notes}: ${customer.notes}`] : []),
    '',
    c.footer,
    c.shop
  ].join('\n')

  // HTML version (inline styles, since many email apps ignore <style>)
  const e = escapeHtml
  const cell = 'padding:8px 0;border-bottom:1px solid #e7e5e4;'
  const html = `<!doctype html>
<html lang="${order.locale}">
<body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;">
<tr><td style="padding:32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="font-size:20px;font-weight:bold;padding-bottom:24px;">${e(c.shop)}</td></tr>
  <tr><td style="font-size:15px;line-height:1.5;">
    <p style="margin:0 0 8px;">${e(c.greeting(customer.name))}</p>
    <p style="margin:0 0 20px;">${e(c.intro)}</p>
    <p style="margin:0;font-size:14px;color:#57534e;">${e(c.number)}: <strong style="color:#1c1917;font-family:Consolas,monospace;">${e(order.number)}</strong><br>${e(c.date)}: ${e(date)}</p>
  </td></tr>
  <tr><td style="padding-top:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr style="color:#78716c;text-align:left;">
        <th style="${cell}font-weight:normal;text-align:left;">${e(c.product)}</th>
        <th style="${cell}font-weight:normal;text-align:center;">${e(c.quantity)}</th>
        <th style="${cell}font-weight:normal;text-align:right;">${e(c.price)}</th>
      </tr>
      ${order.items.map(item => `<tr>
        <td style="${cell}">${e(item.name)}<br><span style="color:#78716c;font-size:13px;">${e(size(item.size))}</span></td>
        <td style="${cell}text-align:center;">${item.quantity}</td>
        <td style="${cell}text-align:right;">${e(money(item.total))}</td>
      </tr>`).join('')}
      <tr><td colspan="2" style="padding:12px 0 4px;color:#57534e;">${e(c.subtotal)}</td><td style="padding:12px 0 4px;text-align:right;">${e(money(order.subtotal))}</td></tr>
      <tr><td colspan="2" style="padding:4px 0;color:#57534e;">${e(c.shipping)}</td><td style="padding:4px 0;text-align:right;">${e(shipping)}</td></tr>
      <tr><td colspan="2" style="padding:12px 0 0;font-size:16px;font-weight:bold;border-top:1px solid #e7e5e4;">${e(c.total)}</td><td style="padding:12px 0 0;font-size:16px;font-weight:bold;text-align:right;border-top:1px solid #e7e5e4;">${e(money(order.total))}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding-top:28px;font-size:14px;line-height:1.5;">
    <p style="margin:0 0 6px;font-weight:bold;">${e(c.payment)}: ${e(c[customer.payment])}</p>
    <p style="margin:0;">${e(paymentIntro)}</p>
    ${paymentLines.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:10px;background:#f5f5f4;border-radius:8px;padding:12px 16px;font-size:14px;">
      ${paymentLines.map(([label, value]) => `<tr><td style="padding:3px 16px 3px 0;color:#57534e;">${e(label)}</td><td style="padding:3px 0;font-weight:bold;">${e(value)}</td></tr>`).join('')}
    </table>` : ''}
  </td></tr>
  <tr><td style="padding-top:28px;font-size:14px;line-height:1.5;">
    <p style="margin:0 0 6px;font-weight:bold;">${e(c.delivery)}</p>
    <p style="margin:0;">${address.map(e).join('<br>')}</p>
    ${customer.notes ? `<p style="margin:12px 0 0;"><span style="color:#57534e;">${e(c.notes)}:</span> ${e(customer.notes)}</p>` : ''}
  </td></tr>
  <tr><td style="padding-top:32px;font-size:13px;color:#78716c;border-top:1px solid #e7e5e4;margin-top:24px;">
    <p style="margin:16px 0 0;">${e(c.footer)}</p>
  </td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  return { subject: c.subject(order.number), text, html }
}

type NotifiedStatus = Exclude<OrderStatus, 'new'>

const statusCopy: Record<'pl' | 'en', Record<NotifiedStatus, { subject: string, message: string }> & { greeting: (name: string) => string, number: string, footer: string, shop: string }> = {
  pl: {
    shop: 'Clothing Store',
    greeting: name => `Dzień dobry ${name},`,
    number: 'Numer zamówienia',
    footer: 'Masz pytania? Odpowiedz na tę wiadomość i podaj numer zamówienia.',
    processing: { subject: 'Zamówienie {n} jest w realizacji', message: 'Twoje zamówienie jest w realizacji. Damy znać, gdy zostanie wysłane.' },
    shipped: { subject: 'Zamówienie {n} zostało wysłane', message: 'Twoje zamówienie zostało wysłane i wkrótce do Ciebie dotrze.' },
    delivered: { subject: 'Zamówienie {n} zostało dostarczone', message: 'Twoje zamówienie zostało dostarczone. Dziękujemy za zakupy!' },
    cancelled: { subject: 'Zamówienie {n} zostało anulowane', message: 'Twoje zamówienie zostało anulowane. Jeśli masz pytania, odpowiedz na tę wiadomość.' }
  },
  en: {
    shop: 'Clothing Store',
    greeting: name => `Hello ${name},`,
    number: 'Order number',
    footer: 'Questions? Just reply to this email and include your order number.',
    processing: { subject: 'Order {n} is being prepared', message: 'Your order is being prepared. We\'ll let you know when it ships.' },
    shipped: { subject: 'Order {n} has been shipped', message: 'Your order has been shipped and will be with you soon.' },
    delivered: { subject: 'Order {n} has been delivered', message: 'Your order has been delivered. Thank you for shopping with us!' },
    cancelled: { subject: 'Order {n} has been cancelled', message: 'Your order has been cancelled. If you have any questions, just reply to this email.' }
  }
}

/** Renders a "your order status changed" email for the order's current status. */
export function renderStatusUpdate(order: StoredOrder) {
  if (order.status === 'new') throw new Error('No status email for "new" orders')
  const c = statusCopy[order.locale]
  const s = c[order.status]
  const subject = s.subject.replace('{n}', order.number)
  const e = escapeHtml

  const text = [c.greeting(order.customer.name), '', s.message, '', `${c.number}: ${order.number}`, '', c.footer, c.shop].join('\n')
  const html = `<!doctype html>
<html lang="${order.locale}">
<body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;">
<tr><td style="padding:32px;font-size:15px;line-height:1.5;">
  <p style="margin:0 0 24px;font-size:20px;font-weight:bold;">${e(c.shop)}</p>
  <p style="margin:0 0 8px;">${e(c.greeting(order.customer.name))}</p>
  <p style="margin:0 0 20px;">${e(s.message)}</p>
  <p style="margin:0;font-size:14px;color:#57534e;">${e(c.number)}: <strong style="color:#1c1917;font-family:Consolas,monospace;">${e(order.number)}</strong></p>
  <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e7e5e4;font-size:13px;color:#78716c;">${e(c.footer)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, text, html }
}
