"use client";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminAttemptsPage() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage all test-related operations</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Attempts</h1>
              <p className="text-gray-600">View and manage all test attempts</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Attempts Management</h3>
              <p className="text-sm text-gray-600">
                This feature will be available soon. Admin API endpoints for viewing attempts need to be implemented.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
