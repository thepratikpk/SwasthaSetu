import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  requests: any[];
  patientId: string;
  setPatientId: (id: string) => void;
  onVerified: (name: string) => void;
};

export default function PatientVerification({
  requests,
  patientId,
  setPatientId,
  onVerified,
}: Props) {
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPatient = () => {
    const q = patientId.trim().toLowerCase();
    const match = requests.find(
      (r) =>
        r.userId.toLowerCase() === q ||
        (r.patientName || "").toLowerCase().includes(q),
    );
    if (match) {
      setFetchedName(match.patientName || `Patient ${match.userId}`);
      setFetchError(null);
    } else {
      setFetchedName(null);
      setFetchError("No patient found. Try full ID or part of the name.");
    }
  };

  useEffect(() => {
    if (patientId && !fetchedName && !fetchError) {
      fetchPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          placeholder="Enter Patient ID or Name"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchPatient();
          }}
        />
        <Button onClick={fetchPatient}>Fetch Patient</Button>
      </div>

      {fetchedName && (
        <div className="mt-3 rounded-md border bg-secondary/30 p-3">
          <div className="font-medium">{fetchedName}</div>
          <div className="mt-2 text-sm">Is this the correct patient?</div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => onVerified(fetchedName)}>
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFetchedName(null);
                setPatientId("");
              }}
            >
              No
            </Button>
          </div>
        </div>
      )}
      {fetchError && (
        <div className="mt-3 text-sm text-destructive">{fetchError}</div>
      )}
    </div>
  );
}
