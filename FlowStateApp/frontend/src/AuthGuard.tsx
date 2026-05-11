import { Navigate, useLocation } from "react-router-dom"
import type { AuthGuardProps } from "./types"

export const AuthGuard = ({ children }: AuthGuardProps) => {

  const userType = localStorage.getItem("fs_role")
  const location = useLocation()

  if (userType === "viewer") {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}