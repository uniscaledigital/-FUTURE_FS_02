import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { getRoleLabel, getRoleVariant } from "@/lib/roles";

export interface RoleBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "admin" | "member" | "viewer" | null | undefined;
}

function RoleBadge({ role, className, ...props }: RoleBadgeProps) {
  return (
    <Badge variant={getRoleVariant(role)} className={className} {...props}>
      {role === "admin" ? "👑 " : role === "member" ? "👨‍💼 " : "👀 "}
      {getRoleLabel(role)}
    </Badge>
  );
}

RoleBadge.displayName = "RoleBadge";

export { RoleBadge };
