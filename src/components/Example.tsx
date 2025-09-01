'use client'

import { signOut } from "next-auth/react"
import { useAuth } from "../hooks/use-session"
import { Button } from "./ui/button"

export default function UserProfile() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please sign in to view your profile.</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4">
        {/* <Image
          src={user?.image || ''}
          alt={user?.name || ''}
          className="w-16 h-16 rounded-full"
          height={12}
          width={12}
        /> */}
        <div>
          <h3 className="text-lg font-semibold">{user?.name}</h3>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>
      <Button
        onClick={() => signOut()}
        variant="outline"
        className="mt-4"
      >
        Sign Out
      </Button>
    </div>
  )
}