"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { id: "tests", label: "Tests", icon: "📝", path: "/tests" },
  { id: "attempts", label: "Attempts", icon: "📋", path: "/attempts" },
  { id: "analytics", label: "Analytics", icon: "📈", path: "/analytics" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-24 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white border-r border-gray-200 fixed left-0 h-[calc(100vh)] overflow-y-auto transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } z-40`}
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || 
                (item.path !== "/" && pathname?.startsWith(item.path));
              
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 mt-auto">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

