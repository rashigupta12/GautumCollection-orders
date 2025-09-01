
import AuthButton from "@/components/auth/auth-button"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await auth()
  console.log(session)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
  <AuthButton/>
  )
}