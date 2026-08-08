"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";

interface Option {
  id: string;
  name: string;
}

export function SessionFilters({ setters, leadLists }: { setters: Option[]; leadLists: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={searchParams.get("setter") ?? ""} onChange={(e) => updateParam("setter", e.target.value)}>
        <option value="">All setters</option>
        {setters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select value={searchParams.get("leadList") ?? ""} onChange={(e) => updateParam("leadList", e.target.value)}>
        <option value="">All lead lists</option>
        {leadLists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
