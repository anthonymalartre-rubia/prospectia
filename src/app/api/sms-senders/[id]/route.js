// /api/sms-senders/[id]
//
// DELETE → supprime un sender :
//   - type 'volia_managed' : on libère le numéro côté Twilio (best-effort, 404 toléré)
//   - type 'byo'           : on supprime juste la row (le numéro reste chez le user)

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { releaseTwilioNumber } from '@/lib/twilio-numbers';

export async function DELETE(_request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: sender, error: fetchErr } = await supabase
    .from('sms_senders')
    .select('id, type, twilio_phone_sid')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    console.error('[api/sms-senders/[id]] fetch error', fetchErr);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }
  if (!sender) {
    return NextResponse.json({ error: 'Sender introuvable' }, { status: 404 });
  }

  // Pour les numéros Volia-managed : on libère côté Twilio AVANT de delete
  // la row. Si Twilio rate, on remonte l'erreur et on ne touche pas la DB —
  // ça évite de perdre le SID et de laisser un numéro orphelin facturé.
  if (sender.type === 'volia_managed' && sender.twilio_phone_sid) {
    try {
      await releaseTwilioNumber(sender.twilio_phone_sid);
    } catch (err) {
      console.error('[api/sms-senders/[id]] release error', err);
      return NextResponse.json(
        {
          error: err.message || 'Échec libération du numéro Twilio',
          code: err.code,
        },
        { status: 502 }
      );
    }
  }

  const { error: delErr } = await supabase
    .from('sms_senders')
    .delete()
    .eq('id', id);

  if (delErr) {
    console.error('[api/sms-senders/[id]] delete error', delErr);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
