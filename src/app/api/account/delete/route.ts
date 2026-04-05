import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cleanupUserBilling } from '@/lib/account-cleanup';

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const admin = createAdminClient();

  // 0. Cancella abbonamento Stripe e invia email di conferma eliminazione
  //    (prima di toccare qualsiasi dato, così se qualcosa va storto l'utente
  //    non si ritrova con account parzialmente cancellato e billing attivo)
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  await cleanupUserBilling({
    email: user.email,
    stripeCustomerId: profile?.stripe_customer_id,
  });

  // Marca l'utente come "billing già gestito" così il trigger DB
  // (BEFORE DELETE ON auth.users) non invia una seconda email né tenta
  // di ricancellare l'abbonamento quando eseguiamo deleteUser() più sotto.
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, billing_cleanup_done: true },
  });

  // Delete user data in order (respecting foreign keys)
  // 1. Subscriptions
  await admin.from('subscriptions').delete().eq('user_id', user.id);

  // 2. Notifications
  await admin.from('notifications').delete().eq('user_id', user.id);

  // 3. Quote tokens (via quotes)
  const { data: quotes } = await admin
    .from('quotes')
    .select('id')
    .eq('user_id', user.id);

  if (quotes && quotes.length > 0) {
    const quoteIds = quotes.map((q) => q.id);
    await admin.from('quote_tokens').delete().in('quote_id', quoteIds);
  }

  // 4. Quotes
  await admin.from('quotes').delete().eq('user_id', user.id);

  // 5. Clients
  await admin.from('clients').delete().eq('user_id', user.id);

  // 6. Company profiles
  await admin.from('company_profiles').delete().eq('user_id', user.id);

  // 7. Avatar from storage
  const { data: avatarFiles } = await admin.storage
    .from('avatars')
    .list(user.id);

  if (avatarFiles && avatarFiles.length > 0) {
    const paths = avatarFiles.map((f) => `${user.id}/${f.name}`);
    await admin.storage.from('avatars').remove(paths);
  }

  // 8. Profile
  await admin.from('profiles').delete().eq('id', user.id);

  // 9. Delete auth user
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error('[delete-account] error:', error);
    return NextResponse.json({ error: 'Errore durante la cancellazione' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
