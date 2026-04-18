type DropdownMenuProps = {
  items: string[];
  className?: string;
};

export function DropdownMenu({ items, className }: DropdownMenuProps) {
  const classes = ["zelify-dropdown-menu", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="menu">
      {items.map((item) => (
        <button key={item} type="button" role="menuitem" className="zelify-dropdown-menu__item">
          {item}
        </button>
      ))}
    </div>
  );
}
