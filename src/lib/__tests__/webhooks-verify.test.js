// Tests pour les helpers de vérification de signatures webhook.
import { createHmac, randomBytes } from 'node:crypto';
import { verifyResendSignature } from '../webhooks/resend-verify';
import { verifyTwilioSignature } from '../webhooks/twilio-verify';

describe('verifyResendSignature', () => {
  // Construit un secret au format whsec_<base64>
  const keyRaw = randomBytes(32);
  const secret = `whsec_${keyRaw.toString('base64')}`;

  function buildHeaders({ payload, svixId = 'msg_test', timestamp }) {
    const ts = String(timestamp ?? Math.floor(Date.now() / 1000));
    const signedPayload = `${svixId}.${ts}.${payload}`;
    const sig = createHmac('sha256', keyRaw).update(signedPayload).digest('base64');
    return {
      'svix-id': svixId,
      'svix-timestamp': ts,
      'svix-signature': `v1,${sig}`,
    };
  }

  it('valide une signature correcte', () => {
    const payload = JSON.stringify({ type: 'email.delivered', data: { email_id: 'abc' } });
    const headers = buildHeaders({ payload });
    expect(verifyResendSignature({ payload, headers, secret })).toBe(true);
  });

  it('rejette une signature falsifiée', () => {
    const payload = JSON.stringify({ type: 'email.delivered' });
    const headers = buildHeaders({ payload });
    headers['svix-signature'] = 'v1,ZmFrZXNpZ25hdHVyZQ==';
    expect(() => verifyResendSignature({ payload, headers, secret })).toThrow(/aucune signature valide/);
  });

  it('rejette un timestamp trop ancien (replay)', () => {
    const payload = '{}';
    const headers = buildHeaders({ payload, timestamp: 0 });
    expect(() => verifyResendSignature({ payload, headers, secret })).toThrow(/hors tolérance/);
  });

  it('rejette des headers manquants', () => {
    expect(() => verifyResendSignature({ payload: '{}', headers: {}, secret })).toThrow(/headers Svix/);
  });

  it('rejette un secret manquant', () => {
    expect(() => verifyResendSignature({ payload: '{}', headers: {}, secret: '' })).toThrow(/secret manquant/);
  });

  it('supporte plusieurs signatures (rotation de clé)', () => {
    const payload = '{}';
    const headers = buildHeaders({ payload });
    // ajoute une signature invalide en premier — la 2e (la nôtre) doit passer
    headers['svix-signature'] = `v1,fake ${headers['svix-signature']}`;
    expect(verifyResendSignature({ payload, headers, secret })).toBe(true);
  });
});

describe('verifyTwilioSignature', () => {
  const authToken = 'test_auth_token_xxx';
  const url = 'https://example.com/api/webhooks/twilio/status';
  const params = { MessageSid: 'SM123', MessageStatus: 'delivered', AccountSid: 'AC1' };

  function sign(url, params, token) {
    const keys = Object.keys(params).sort();
    let data = url;
    for (const k of keys) data += k + params[k];
    return createHmac('sha1', token).update(data, 'utf8').digest('base64');
  }

  it('valide une signature correcte', () => {
    const twilioSignature = sign(url, params, authToken);
    expect(verifyTwilioSignature({ url, params, twilioSignature, authToken })).toBe(true);
  });

  it('rejette une signature avec mauvais token', () => {
    const twilioSignature = sign(url, params, 'wrong');
    expect(verifyTwilioSignature({ url, params, twilioSignature, authToken })).toBe(false);
  });

  it('rejette si un param est modifié', () => {
    const twilioSignature = sign(url, params, authToken);
    const tampered = { ...params, MessageStatus: 'failed' };
    expect(verifyTwilioSignature({ url, params: tampered, twilioSignature, authToken })).toBe(false);
  });

  it('rejette si url change', () => {
    const twilioSignature = sign(url, params, authToken);
    expect(verifyTwilioSignature({ url: url + '?x=1', params, twilioSignature, authToken })).toBe(false);
  });

  it('rejette les args manquants', () => {
    expect(verifyTwilioSignature({ url: '', params, twilioSignature: 'x', authToken })).toBe(false);
    expect(verifyTwilioSignature({ url, params: null, twilioSignature: 'x', authToken })).toBe(false);
  });
});
