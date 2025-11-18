"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { api } from "@/utils/api";

interface DashboardStats {
  totalTests: number;
  activeTests: number;
  totalAttempts: number;
  totalUsers: number;
  recentTests: any[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [testsResponse, statsResponse] = await Promise.all([
        api.admin.tests.getAll(),
        api.admin.stats.get().catch(() => null),
      ]);

      const tests = testsResponse.data || [];
      const statsData = statsResponse?.data || {};
      
      setStats({
        totalTests: statsData.totalTests || tests.length,
        activeTests: statsData.activeTests || tests.length,
        totalAttempts: statsData.totalAttempts || 0,
        totalUsers: statsData.totalUsers || 0,
        recentTests: tests.slice(0, 5),
      });
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user?.name || user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Overview</h1>
              <p className="text-gray-600">Monitor and manage your test platform</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Statistics Cards */}
            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Tests</h3>
                      <span className="text-2xl">📝</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
                    <p className="text-xs text-gray-500 mt-1">All tests</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Active Tests</h3>
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeTests}</p>
                    <p className="text-xs text-gray-500 mt-1">Currently active</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Attempts</h3>
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
                    <p className="text-xs text-gray-500 mt-1">All attempts</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
                      <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">Registered users</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      href="/tests/create"
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">➕</span>
                      <div>
                        <div className="font-semibold text-gray-900">Create New Test</div>
                        <div className="text-xs text-gray-500">Add a new test to platform</div>
                      </div>
                    </Link>
                    <Link
                      href="/tests"
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">📝</span>
                      <div>
                        <div className="font-semibold text-gray-900">View All Tests</div>
                        <div className="text-xs text-gray-500">Manage existing tests</div>
                      </div>
                    </Link>
                    <Link
                      href="/attempts"
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">📋</span>
                      <div>
                        <div className="font-semibold text-gray-900">View Attempts</div>
                        <div className="text-xs text-gray-500">Monitor test attempts</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Recent Tests */}
                {stats.recentTests.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Recent Tests</h2>
                      <Link
                        href="/tests"
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                      >
                        View All →
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {stats.recentTests.map((test: any) => (
                        <Link
                          key={test.id || test._id}
                          href={`/tests/${test.id || test._id}`}
                          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900 text-sm">{test.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {test.totalQuestions || test.questions?.length || 0} questions • {test.durationMinutes} min • ₹{test.price}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
