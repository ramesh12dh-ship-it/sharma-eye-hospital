// RLS / RPC deny-path verification.
//
// Signs in as the given user (must be a non-admin, non-store_manager
// account — receptionist / optician / accountant) and exercises the
// privileged paths that should now be denied at the DB layer.
//
// Run:
//   node --env-file=.env.local tests/rls.mjs <email> <password>

import { createClient } from '@supabase/supabase-js'

const [, , email, password] = process.argv
if (!email || !password) {
  console.error('usage: node --env-file=.env.local tests/rls.mjs <email> <password>')
  process.exit(2)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in env')
  process.exit(2)
}

const supabase = createClient(url, anon, { auth: { persistSession: false } })

const { data: signin, error: signinErr } =
  await supabase.auth.signInWithPassword({ email, password })
if (signinErr) {
  console.error('sign-in failed:', signinErr.message)
  process.exit(1)
}
const uid = signin.user.id
console.log(`signed in as ${email} (${uid})`)

const { data: roleRows } = await supabase
  .from('user_roles').select('role').eq('user_id', uid)
const roles = roleRows?.map(r => r.role) ?? []
console.log(`roles: ${roles.join(', ') || '(none)'}`)
if (roles.includes('admin') || roles.includes('store_manager')) {
  console.warn(
    '⚠ this account has admin or store_manager — deny-path tests will look like passes. ' +
    'use a receptionist/optician/accountant account.',
  )
}
console.log()

let pass = 0, fail = 0
const check = (label, ok, detail) => {
  if (ok) { console.log(`✓ ${label}`); pass++ }
  else    { console.log(`✗ ${label}\n  ${detail}`); fail++ }
}

// ── Test 1: UPDATE on optical_orders should be silently denied
const { data: order } = await supabase
  .from('optical_orders').select('order_id, status').limit(1).maybeSingle()
if (!order) {
  console.log('— skipped: no optical_orders rows to test against')
} else {
  const { data: upd, error } = await supabase
    .from('optical_orders')
    .update({ status: order.status === 'delivered' ? 'ready' : 'delivered' })
    .eq('order_id', order.order_id)
    .select()
  check(
    'optical_orders UPDATE denied (silent zero rows)',
    !error && Array.isArray(upd) && upd.length === 0,
    error ? `error: ${error.message}` : `got ${upd?.length} updated rows — RLS allowed it`,
  )
}

// ── Test 2: void_sale RPC should reject with explicit error
const { data: sale } = await supabase
  .from('sales').select('sale_id').limit(1).maybeSingle()
if (!sale) {
  console.log('— skipped: no sales rows to test against')
} else {
  const { error } = await supabase.rpc('void_sale', {
    target_sale_id: sale.sale_id,
    admin_user_id: uid,
  })
  check(
    'void_sale RPC rejects non-store_manager',
    !!error && /not authorized/i.test(error.message),
    error ? `unexpected error: ${error.message}` : 'rpc succeeded — function guard missing',
  )
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
