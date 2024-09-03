import Link from "next/link";

export function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link href="/proposals">Proposals</Link>
        </li>
        <li>
          <Link href="/create">Create</Link>
        </li>
      </ul>
    </nav>
  );
}
