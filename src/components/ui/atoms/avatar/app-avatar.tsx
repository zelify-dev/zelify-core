type AppAvatarProps = {
  initials: string;
  className?: string;
};

export function AppAvatar({ initials, className }: AppAvatarProps) {
  const classes = ["zelify-avatar", className ?? ""].filter(Boolean).join(" ");

  return <span className={classes}>{initials}</span>;
}
