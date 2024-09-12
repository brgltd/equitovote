"use client";

// import Link from "next/link";
// import { ConnectButton } from "@rainbow-me/rainbowkit";

// export function Navbar() {
//   return (
//     <nav>
//       <ul className="flex flex-row items-center mt-6 mb-8">
//         <li className="ml-12 mr-12">
//           <Link href="/">Proposals</Link>
//         </li>
//         <li>
//           <Link href="/create">Create</Link>
//         </li>
//         <li className="ml-auto mr-12">
//           <ConnectButton
//             chainStatus="full"
//             showBalance={false}
//             accountStatus={{
//               smallScreen: "avatar",
//               largeScreen: "full",
//             }}
//           />
//         </li>
//       </ul>
//     </nav>
//   );
// }

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, Tab } from "@mui/material";
import { SyntheticEvent, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  const [value, setValue] = useState<null | number>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      setValue(0);
    } else if (pathname === "/create") {
      setValue(1);
    } else {
      setValue(null);
    }
  }, [pathname]);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className="flex md:flex-row flex-col md:items-start items-center mt-6 mb-8 justify-center">
      <div className="md:ml-12 mb-8 md:mb-8">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="navigation tabs"
        >
          <Tab label="Proposals" component={Link} href="/" sx={{ mx: 1 }} />
          <Tab label="Create" component={Link} href="/create" sx={{ mx: 1 }} />
        </Tabs>
      </div>
      <div className="md:ml-auto md:mr-12">
        <ConnectButton
          chainStatus="full"
          showBalance={false}
          accountStatus={{
            smallScreen: "avatar",
            largeScreen: "full",
          }}
        />
      </div>
    </div>
  );
}
