export function getInviteCode() {
  const saved = window.localStorage.getItem("olx-invite-code");
  if (saved) return saved;
  const next = String(100000 + Math.floor(Math.random() * 900000));
  window.localStorage.setItem("olx-invite-code", next);
  return next;
}

export function inviteLink(origin: string, code: string) {
  return `${origin}/register?invite=${code}`;
}
