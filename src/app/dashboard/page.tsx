
// import AuthButton from "@/components/auth/auth-button"
// import { auth } from "@/lib/auth"
// import { redirect } from "next/navigation"

// export default async function Dashboard() {
//   const session = await auth()
//   console.log(session)

//   if (!session?.user) {
//     redirect("/auth/signin")
//   }

//   return (
//   <AuthButton/>
//   )
// }


"use client";

import OrderContainer from "@/components/orders/OrderContainer";
import OrderForm from "@/components/orders/OrderForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertCircle,
  FileText,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, SetStateAction } from "react";

function OrdersWithParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const initialTab = searchParams.get("tab") || "order-summary";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "order-summary";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  const handleTabChange = (tab: SetStateAction<string>) => {
    setActiveTab(tab);
    router.replace(`/orders?tab=${tab}`);
    setMobileSidebarOpen(false);
  };

  // Server Action for sign out (recommended for next-auth 5, Next.js 15.5)
  const handleLogout = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ redirect: false }); // Prevent page reload if desired
    router.push("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "order-summary":
        return <OrderContainer />;
      case "order-form":
        return <OrderForm />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">
              Orders Dashboard
            </h2>
            <p className="text-emerald-600">Welcome to your order management dashboard.</p>
          </div>
        );
    }
  };

  const isFormView = activeTab === "order-form";

  // Loading state for session
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <span>Loading...</span>
      </div>
    );
  }

  // If not authenticated, redirect or show login button (Next.js pattern)
  if (!isAuthenticated) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-50 md:z-auto flex flex-col w-64 border-r border-gray-200 bg-white`}
      >
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            >
              {mobileSidebarOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            <button
              onClick={() => handleTabChange("order-summary")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                activeTab === "order-summary" || activeTab === "order-form"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <FileText className="mr-3 h-5 w-5" />
              Orders
            </button>
          </nav>
          {/* User Info */}
          <div className="flex-shrink-0 p-2 sm:p-3 border-t border-emerald-100">
            <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-2 sm:p-3">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium text-black truncate mb-1 capitalize">
                  {user?.name || user?.email || "User"}
                </div>
                {user?.email && (
                  <div className="text-xs text-emerald-600 truncate opacity-90 mb-1">
                    {user.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav */}
        <nav className="bg-white shadow-lg border-b-2 border-emerald-200 px-3 sm:px-4 py-2 flex-shrink-0 z-40">
          <div className="flex items-center justify-between relative">
            {/* Left */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            {/* Center - Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="font-bold">Gautam Collection</h1>
            </div>
            {/* Right */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutConfirm(true)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
              {/* Popover User Menu (Desktop) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-1 hover:bg-emerald-50 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <span className="text-sm text-emerald-700 font-medium">
                      {user?.name || user?.email || "User"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 border border-emerald-200 bg-white shadow-md" align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full justify-start gap-2 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </nav>
        {/* Back Button for Form */}
        {isFormView && (
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <Button
              variant="ghost"
              onClick={() => handleTabChange("order-summary")}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
            >
              <X className="h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        )}
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full mx-auto py-2">
            {renderContent()}
          </div>
        </main>
      </div>
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader className="justify-center items-center">
            <AlertDialogTitle>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit the app?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center space-x-2">
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)} className="mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// The page-level export MUST wrap your client component in Suspense
export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-50">Loading dashboard...</div>}>
      <OrdersWithParams />
    </Suspense>
  );
}
