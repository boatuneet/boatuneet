import ComingSoon from "./components/ComingSoon";
import { getStatus } from "@/lib/waitlist";

// Spot counts must be current on every visit, never baked in at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  return <ComingSoon status={await getStatus()} />;
}
