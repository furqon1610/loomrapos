import type { ReactNode } from "react";
import { getOwnerContext } from "@/lib/tenant";
import EmployeeTabs from "./employee-tabs";

export default async function EmployeesLayout({ children }: { children: ReactNode }) {
  const { tenant } = await getOwnerContext();

  return (
    <div>
      {tenant.package === "pro" && <EmployeeTabs />}
      {children}
    </div>
  );
}
