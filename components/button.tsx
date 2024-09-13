import { lightTheme } from "@/app/layout";
import { Button as MuiButton } from "@mui/material";
import { ReactNode } from "react";

export function Button({
  onClick,
  children,
}: {
  onClick: <T>(...args: T[]) => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <MuiButton
      onClick={onClick}
      variant="contained"
      sx={{
        backgroundColor: "rgba(25, 118, 210, 0.5)",
        color: "white",
        "&:hover": {
          bgcolor: lightTheme.palette.primary.dark,
        },
      }}
    >
      {children}
    </MuiButton>
  );
}
