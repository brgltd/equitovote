import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export function TransactionModal({ isOpen, onClose }: any) {
  return (
    <div>
      <Modal open={isOpen} onClose={onClose}>
        <div>
          <div>
            <div>Fees Source Chain</div>
            <div>Fee Destination Chain</div>
            <div>(Equito Voting Fee)</div>
            <div>Total Cross Chain Fee</div>
          </div>
          <div>
            <div>Details (Count 1000 votes from chain_name)</div>
            <div>
              <div>Total time</div>
              <div>00h 00m 00s</div>
            </div>
          </div>
          <div>
            <div>
              <div>(Sending votes on source Chain)</div>
              <div>00h 00m 00s icon</div>
            </div>
            <div>
              <div>Generating Proof on Source Chain</div>
              <div>00h 00m 00s icon</div>
            </div>
            <div>
              <div>Executing Message on Destination Chain</div>
              <div>00h 00m 00s icon</div>
            </div>
            <div>View in Explorer icon</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
