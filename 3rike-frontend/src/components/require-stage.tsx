import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getVerificationStatus } from "@/lib/ownership";

type RequireStageProps = {
  // The earliest stage allowed in: "approved" for buying a 3rike,
  // "3riker" for screens about the 3rike you own.
  stage: "approved" | "3riker";
  children: ReactNode;
};

// KYC comes first: anyone who hasn't done it is sent to the KYC form, and
// anyone still under review goes back home where the status sheet opens.
export default function RequireStage({ stage, children }: RequireStageProps) {
  const status = getVerificationStatus();
  if (status === "not_started") {
    return <Navigate to="/driver/verification" replace state={{ kycRequired: true }} />;
  }
  if (status === "in_progress") {
    return <Navigate to="/driver" replace state={{ kycPending: true }} />;
  }
  if (stage === "3riker" && status === "approved") {
    return <Navigate to="/driver/own-3rike" replace />;
  }
  return children;
}
