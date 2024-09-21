import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Status } from "@/types";

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

export function TransactionModal({ isOpen, onClose, fees, text, status }: any) {
  const {
    formattedSourceChainFee,
    formattedDestinationChainFee,
    formattedOperationFee,
    formattedTotalUserFee,
    initialStepTitle,
  } = fees;

  const { operationFeeTitle, detailsTitle, successfulTitle } = text;

  return (
    <div>
      <Modal open={isOpen} onClose={onClose}>
        <div>
          <div>
            <div>Fees Source Chain: {formattedSourceChainFee}</div>
            <div>Fee Destination Chain: {formattedDestinationChainFee}</div>
            <div>
              {operationFeeTitle}: {formattedOperationFee}
            </div>
            <div>Total Cross Chain Fee: {formattedTotalUserFee}</div>
          </div>
          <div>
            <div>Details: {detailsTitle}</div>
            <div>
              {status === Status.IsCompleted ? (
                <div>Completed</div>
              ) : status === Status.IsRetry ? (
                <div>Error</div>
              ) : (
                <div>In Progress</div>
              )}
            </div>
            <div>
              <div>Total time</div>
              <div>00h 00m 00s</div>
            </div>
          </div>
          <div>
            <div>
              <div>Waiting for Wallet Confirmation</div>
              <div>
                <div>00h 00m 00s</div>
                {status === Status.IsStart ? (
                  <div>spinner</div>
                ) : (
                  <div>Done</div>
                )}
              </div>
            </div>
            <div>
              <div>{initialStepTitle}</div>
              <div>
                <div>00h 00m 00s icon</div>
                {status === Status.IsStart && <div>spinner</div>}
                {/* {status === Status.IsExecutingMessageOnDestinationChain ||
                  (status === Status.IsCompleted && <div>done</div>)} */}
              </div>
            </div>
            <div>
              <div>Generating Proof on Source Chain</div>
              <div>
                <div>00h 00m 00s icon</div>
                {status === Status.IsGeneratingProofOnSourceChain && (
                  <div>spinner</div>
                )}
                {status === Status.IsExecutingMessageOnDestinationChain ||
                  (status === Status.IsCompleted && <div>done</div>)}
              </div>
            </div>
            <div>
              <div>Executing Message on Destination Chain</div>
              <div>00h 00m 00s icon</div>
            </div>
            {status === Status.IsCompleted && (
              <div>
                <div>{successfulTitle}</div>
                <div>View in Explorer icon</div>
              </div>
            )}
            {status === Status.IsRetry && <div>close</div>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
