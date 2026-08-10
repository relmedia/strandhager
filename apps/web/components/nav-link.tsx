import Link from "next/link";

import type { NavItem } from "@/lib/site-content";

type NavLinkProps = {
  item: NavItem;
  className?: string;
  onClick?: () => void;
};

/**
 * Renders a menu item from the CMS. Section anchors are resolved against the
 * front page so they also work from subpages such as the galleries.
 */
export function NavLink({ item, className, onClick }: NavLinkProps) {
  const href = item.href.startsWith("#") ? `/${item.href}` : item.href;
  const isPage = href.startsWith("/") && !href.includes("#");

  if (isPage) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {item.label}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick}>
      {item.label}
    </a>
  );
}
