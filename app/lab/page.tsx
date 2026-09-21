import type { Metadata } from "next";
import ListingLab from "./listing-lab";
import "./lab.css";

export const metadata: Metadata = {
  title: "UNEET Listing Lab — Boat listing intelligence",
  description:
    "An experimental, evidence-first workspace for reviewing boat advertisements.",
  robots: { index: false, follow: false },
};
export default function LabPage() {
  return <ListingLab />;
}
