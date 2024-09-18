import { Button as MuiButton } from "@mui/material";
import { ReactNode } from "react";
import { lightTheme } from "@/app/layout";

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
    <div className={`${isDisabled ? "cursor-not-allowed" : ""} w-max`}>
      <MuiButton
        onClick={onClick}
        variant="contained"
        disabled={isDisabled}
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
  );
}
