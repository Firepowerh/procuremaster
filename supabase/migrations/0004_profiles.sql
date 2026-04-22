-- Internal users (PM, DH, FA). Extends auth.users.
CREATE TABLE public.profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id               uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  full_name            text NOT NULL,
  role                 public.user_role NOT NULL,
  avatar_url           text,
  is_active            boolean NOT NULL DEFAULT true,
  onboarding_complete  boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Enforce one active PM per org
CREATE UNIQUE INDEX one_pm_per_org
  ON public.profiles (org_id)
  WHERE role = 'procurement_manager' AND is_active = true;
