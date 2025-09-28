import useSWR from "swr";
import config from "@/config";

export function useData<T>(endpoint: string) {
  const { data, error, isLoading } = useSWR<T>(endpoint, async (url: string) => {
    const res = await fetch(`${config.api.url}${url}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return (await res.json()) as T;
  });

  return {
    data,
    isLoading,
    isError: error,
  };
}
