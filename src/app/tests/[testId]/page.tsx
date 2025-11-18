"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { api } from "@/utils/api";

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const testId = params.testId as string;
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isAuthenticated) {
      fetchTest();
    }
  }, [isAuthenticated, authLoading, router, testId]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await api.admin.tests.getById(testId);
      if (response.success) {
        setTest(response.data);
      } else {
        throw new Error(response.message || "Failed to load test");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load test");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !test) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <main className="flex-1 overflow-y-auto p-8">
            <div className="text-center">
              <div className="text-red-600 mb-4">{error || "Test not found"}</div>
              <Link
                href="/tests"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                Back to Tests
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
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
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
                <p className="text-gray-600">{test.description || "No description"}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/tests/${testId}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Edit Test
                </Link>
                <Link
                  href="/tests"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back to Tests
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Test Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Category</div>
                  <div className="text-base font-semibold text-gray-900 capitalize">{test.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Duration</div>
                  <div className="text-base font-semibold text-gray-900">{test.durationMinutes} minutes</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Price</div>
                  <div className="text-base font-semibold text-gray-900">₹{test.price}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Questions</div>
                  <div className="text-base font-semibold text-gray-900">{test.questions?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div className={`text-base font-semibold ${test.isActive ? "text-green-600" : "text-red-600"}`}>
                    {test.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
            </div>

            {test.highlights?.length ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What Learners Receive</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.highlights.map((highlight: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                      <div className="text-2xl">{highlight.icon || "✨"}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{highlight.title}</h3>
                        <p className="text-sm text-gray-600">{highlight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {test.instructions?.length ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
                <div className="space-y-3">
                  {test.instructions.map((instruction: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-blue-600 font-semibold">{index + 1}.</span>
                      <p className="text-sm text-gray-700">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Questions ({test.questions?.length || 0})
              </h2>
              <div className="space-y-4">
                {test.questions?.map((question: any, index: number) => (
                  <div
                    key={index}
                    className="p-5 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="text-base font-semibold text-gray-900 mb-3">
                      Question {index + 1}
                    </div>
                    <div className="text-sm text-gray-800 mb-4">{question.text}</div>
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Options:</div>
                      <div className="space-y-2">
                        {question.options.map((option: string, optIndex: number) => (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg border ${
                              optIndex === question.correctAnswer
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-gray-200"
                            } flex items-center gap-3`}
                          >
                            <span className="text-sm font-medium text-gray-600">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="text-sm text-gray-800 flex-1">{option}</span>
                            {optIndex === question.correctAnswer && (
                              <span className="text-xs text-green-600 font-semibold">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
