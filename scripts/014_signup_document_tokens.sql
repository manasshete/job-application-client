-- New free signups previously received only AI extraction tokens, while the
-- Free plan (lib/subscription.ts) and the monthly cron both promise 2 document
-- tokens as well. Grant both at signup so the first CV / cover letter works.

create or replace function public.grant_free_tokens_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.subscription_tier is null or new.subscription_tier = 'free' then
    perform public.grant_tokens(new.id, 'ai_extraction', 5, 'signup');
    perform public.grant_tokens(new.id, 'document_generation', 2, 'signup');
  end if;
  return new;
end;
$$;

revoke all on function public.grant_free_tokens_on_signup() from public, anon, authenticated;
