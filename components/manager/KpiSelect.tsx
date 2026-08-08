"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";

export function KpiSelect<T extends string>({ options, labels, paramName = "kpi" }: {
  options: readonly T[];
  labels: Record<T, string>;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get(paramName) as T) || options[0];

  function setKpi(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onChange={(e) => setKpi(e.target.value)}>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels[opt]}
        </option>
      ))}
    </Select>
  );
}
