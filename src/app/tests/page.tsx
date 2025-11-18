"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { api } from "@/utils/api";

interface Test {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  price: number;
  totalQuestions?: number;
  questions?: any[];
}

export default function AdminTestsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isAuthenticated) {
      fetchTests();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.admin.tests.getAll();
      if (response.success) {
        setTests(response.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      return;
    }

    try {
      await api.admin.tests.delete(testId);
      fetchTests();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || test.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading tests...</p>
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
              <p className="text-sm text-gray-600 mt-1">Manage all test-related operations</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Management</h1>
                <p className="text-gray-600">
                  Manage all tests in your platform ({filteredTests.length} tests)
                </p>
              </div>
              <Link
                href="/tests/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span>➕</span>
                <span>Create Test</span>
              </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Search tests by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="polity">Polity</option>
                  <option value="history">History</option>
                  <option value="geography">Geography</option>
                  <option value="economy">Economy</option>
                  <option value="science">Science</option>
                  <option value="current-affairs">Current Affairs</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Tests Grid */}
            {filteredTests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tests found</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {searchTerm || categoryFilter ? "Try adjusting your filters" : "Get started by creating your first test"}
                </p>
                {!searchTerm && !categoryFilter && (
                  <Link
                    href="/tests/create"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors inline-block"
                  >
                    Create Test
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTests.map((test) => {
                  const testId = test.id || test._id;
                  return (
                    <div
                      key={testId}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">{test.title}</h3>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                              {test.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{test.description}</p>
                          <div className="flex gap-6 text-sm text-gray-500">
                            <span>⏱️ {test.durationMinutes} minutes</span>
                            <span>📝 {test.totalQuestions || test.questions?.length || 0} questions</span>
                            <span>💰 ₹{test.price}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-6">
                          <Link
                            href={`/tests/${testId}`}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/tests/${testId}/edit`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(testId)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
