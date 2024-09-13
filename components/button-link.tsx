import { Button } from "@mui/material";
import Link from "next/link";

export function ButtonLink({ href }: { href: string }) {
  return (
    <Link href={href} passHref legacyBehavior>
      <Button component="a" variant="contained">
        Go to About Page
      </Button>
    </Link>
  );
}
