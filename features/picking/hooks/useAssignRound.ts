import { useState } from "react";
import {
  fetchNewRoundAPI,
  AssignPickerData,
  AssignRondaResponse,
} from "@/api/api";

export function useAssignRonda() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AssignRondaResponse | null>(null);

  const assignRonda = async (
    waveId: number,
    assignData: AssignPickerData,
    productIDs: number[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNewRoundAPI(waveId, assignData, productIDs);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { assignRonda, loading, error, data };
}
