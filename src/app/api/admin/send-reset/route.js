import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    // Check admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const { email, type = 'reset' } = await request.json();

    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: 'Prospect IA <noreply@flottes.lumeafleet.com>',
      to: email,
      subject: type === 'welcome'
        ? 'Bienvenue sur Prospect IA'
        : 'Reinitialisation de votre mot de passe — Prospect IA',
      html: type === 'welcome'
        ? `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#111;color:#fafafa;border-radius:12px">
            <h1 style="font-size:20px;margin:0 0 16px">Bienvenue sur Prospect IA 🚀</h1>
            <p style="color:#a1a1aa;font-size:14px;line-height:1.6">Votre compte a ete cree avec succes. Connectez-vous pour commencer a generer des leads.</p>
            <a href="https://scraping-dom-ezdrive.vercel.app/login" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Se connecter</a>
          </div>`
        : `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#111;color:#fafafa;border-radius:12px">
            <h1 style="font-size:20px;margin:0 0 16px">Reinitialisation du mot de passe</h1>
            <p style="color:#a1a1aa;font-size:14px;line-height:1.6">Un administrateur a reinitialise votre mot de passe. Connectez-vous avec votre nouveau mot de passe ou contactez l'admin.</p>
            <a href="https://scraping-dom-ezdrive.vercel.app/login" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Se connecter</a>
          </div>`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Send reset email error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
