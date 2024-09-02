import Link from "next/link";

export function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link href="/create">Create Proposal</Link>
        </li>
        <li>
          <Link href="/vote">Vote on Proposals</Link>
        </li>
      </ul>
    </nav>
  );
}
