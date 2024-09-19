import { Button as MuiButton } from "@mui/material";
import { ReactNode } from "react";
import { lightTheme } from "./app-layout";
import { cn } from "@/utils/cn";

export function Button({
  onClick,
  children,
  isDisabled = false,
  styles = {},
}: {
  onClick: <T>(...args: T[]) => void | Promise<void>;
  children: ReactNode;
  isDisabled?: boolean;
  styles?: Record<string, string>;
}) {
  return (
    <div className={cn("w-max", isDisabled ? "cursor-not-allowed" : "")}>
      <div className={isDisabled ? "pointer-events-none" : ""}>
        <MuiButton
          onClick={onClick}
          variant="contained"
          sx={{
            backgroundColor: "rgba(25, 118, 210, 0.5)",
            color: "white",
            "&:hover": {
              bgcolor: lightTheme.palette.primary.dark,
            },
            ...styles,
          }}
        >
          {children}
        </MuiButton>
      </div>
    </div>
  );
}
