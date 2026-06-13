// /src/hooks/useFetchPickerUsers.ts
import { useState, useEffect } from "react";
import { fetchPickersAPI } from "@/api/api";
import { PickerUser } from "@/features/picking/types/users";
export function useFetchPickerUsers() {
  const [pickers, setPickers] = useState<PickerUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchPickersAPI()
      .then((users) => {
        // Aquí filtras únicamente a los usuarios con rol "Picker"
        const onlyPickers = users.filter((user) => user.roleName === "Picker");
        setPickers(onlyPickers);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { pickers, loading, error };
}
