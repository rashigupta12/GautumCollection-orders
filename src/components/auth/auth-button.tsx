
import { auth, signOut } from "@/lib/auth"
import Link from "next/link"
import { Button } from "../ui/button"

export default async function AuthButton() {
  const session = await auth()

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Welcome, {session.user.name}!
        </span>
        {/* <Image
          src={session.user.image || ''}
          alt={session.user.name || ''}
          className="w-8 h-8 rounded-full"
          width={12}
          height={12}
        /> */}
        <form
          action={async () => {
            "use server"
            await signOut()
          }}
        >
          <Button variant="outline" size="sm">
            Sign Out
          </Button>
        </form>
      </div>
    )
  }

  return (
    <Link href="/auth/signin">
      <Button>Sign In</Button>
    </Link>
  )
}