"use client";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { api } from "@/utils/api";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

export default function EditTestPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const testId = params.testId as string;
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "polity",
    durationMinutes: 60,
    price: 0,
    isActive: true,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const defaultHighlights = [
    { icon: "✅", title: "Comprehensive Question Bank", description: "Carefully curated questions covering all important topics" },
    { icon: "📊", title: "Instant Results & Analytics", description: "Get detailed performance analysis and track your progress" },
    { icon: "⏰", title: "Timed Practice", description: "Practice under real exam conditions with a focused timer" },
    { icon: "📖", title: "Detailed Solutions", description: "Access comprehensive explanations for each question" },
  ];
  const defaultInstructions = [
    "Read each question carefully before selecting your answer.",
    "You can review and change your answers before submitting.",
    "The timer will start once you begin the test.",
    "Ensure a stable internet connection to avoid interruptions.",
    "Once submitted, you cannot retake the test, so review carefully.",
  ];
  const [highlights, setHighlights] = useState(defaultHighlights);
  const [instructions, setInstructions] = useState(defaultInstructions);
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "highlights", label: "Highlights" },
    { id: "instructions", label: "Instructions" },
    { id: "questions", label: "Questions" },
  ];
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);

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
      setFetchLoading(true);
      const response = await api.admin.tests.getById(testId);
      const test = (response as any)?.data?.data ?? response.data;
      if (!response.success || !test) {
        throw new Error(response.message || "Failed to load test");
      }

      setFormData({
        title: test.title,
        description: test.description || "",
        category: test.category,
        durationMinutes: test.durationMinutes,
        price: test.price,
        isActive: test.isActive,
      });
      setQuestions(
        test.questions.map((q: any) => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
        }))
      );
      setHighlights(test.highlights && test.highlights.length ? test.highlights : defaultHighlights);
      setInstructions(test.instructions && test.instructions.length ? test.instructions : defaultInstructions);
    } catch (err: any) {
      setError(err.message || "Failed to load test");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "durationMinutes" || name === "price"
          ? Number(value)
          : value,
    }));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (field === "options") {
        updated[index] = { ...updated[index], options: value };
      } else if (field === "correctAnswer") {
        updated[index] = { ...updated[index], correctAnswer: Number(value) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const addOption = (questionIndex: number) => {
    if (questions[questionIndex].options.length < 6) {
      handleQuestionChange(questionIndex, "options", [...questions[questionIndex].options, ""]);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length > 2) {
      const newOptions = questions[questionIndex].options.filter((_, i) => i !== optionIndex);
      handleQuestionChange(questionIndex, "options", newOptions);
      if (questions[questionIndex].correctAnswer >= newOptions.length) {
        handleQuestionChange(questionIndex, "correctAnswer", newOptions.length - 1);
      }
    }
  };

  const updateHighlight = (index: number, field: "icon" | "title" | "description", value: string) => {
    setHighlights((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addHighlight = () => {
    setHighlights((prev) => [...prev, { icon: "", title: "", description: "" }]);
  };

  const removeHighlight = (index: number) => {
    setHighlights((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateInstruction = (index: number, value: string) => {
    setInstructions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addInstruction = () => {
    setInstructions((prev) => [...prev, ""]);
  };

  const removeInstruction = (index: number) => {
    setInstructions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title) {
      setError("Title is required");
      return;
    }

    if (questions.some((q) => !q.text || q.options.some((opt) => !opt))) {
      setError("All questions must have text and all options filled");
      return;
    }

    try {
      setLoading(true);
      const preparedHighlights = highlights
        .filter((item) => item.title.trim() && item.description.trim())
        .map((item) => ({
          icon: item.icon.trim() || "",
          title: item.title.trim(),
          description: item.description.trim(),
        }));
      const preparedInstructions = instructions
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const fallbackHighlights = [
        {
          icon: "✅",
          title: "Comprehensive Question Bank",
          description: `${questions.length} carefully curated questions covering all important topics`,
        },
        {
          icon: "📊",
          title: "Instant Results & Analytics",
          description: "Get detailed performance analysis and track your progress",
        },
        {
          icon: "⏰",
          title: "Timed Practice",
          description: `Practice under real exam conditions with a ${formData.durationMinutes}-minute timer`,
        },
        {
          icon: "📖",
          title: "Detailed Solutions",
          description: "Access comprehensive explanations for each question after submission",
        },
      ];
      const fallbackInstructions = [
        "Read each question carefully before selecting your answer.",
        "You can review and change your answers before submitting.",
        `The timer starts when the test begins. You have ${formData.durationMinutes} minutes to complete all ${questions.length} questions.`,
        "Ensure a stable internet connection throughout the test to avoid interruptions.",
        "Once submitted, you cannot retake the test. Review your answers carefully before final submission.",
      ];

      const response = await api.admin.tests.update(testId, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        durationMinutes: formData.durationMinutes,
        price: formData.price,
        isActive: formData.isActive,
        highlights: preparedHighlights.length ? preparedHighlights : fallbackHighlights,
        instructions: preparedInstructions.length ? preparedInstructions : fallbackInstructions,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options,
          answer: q.correctAnswer,
        })),
      });

      if (response.success) {
        router.push(`/tests/${testId}`);
      } else {
        throw new Error(response.message || "Failed to update test");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update test");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetchLoading) {
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Test</h1>
              <p className="text-gray-600">Update test information and questions</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 px-8 pt-6">
                <nav className="flex flex-wrap gap-3">
                  {tabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white shadow"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {activeTab === "overview" && (
                  <section className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Test Information</h2>
                      <p className="text-sm text-gray-600">
                        Keep these details in sync with the public Test Overview panel.
                      </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Test ID</label>
                          <input
                            type="text"
                            value={testId}
                            readOnly
                            className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full resize-vertical rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-6 space-y-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Category *
                          </label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="polity">Polity</option>
                            <option value="history">History</option>
                            <option value="geography">Geography</option>
                            <option value="economy">Economy</option>
                            <option value="science">Science</option>
                            <option value="current-affairs">Current Affairs</option>
                          </select>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Duration (minutes) *
                            </label>
                            <input
                              type="number"
                              name="durationMinutes"
                              value={formData.durationMinutes}
                              onChange={handleInputChange}
                              required
                              min={1}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Price (₹) *
                            </label>
                            <input
                              type="number"
                              name="price"
                              value={formData.price}
                              onChange={handleInputChange}
                              required
                              min={0}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              Visible to learners
                            </label>
                            <span className={`font-semibold ${formData.price > 0 ? "text-purple-600" : "text-green-600"}`}>
                              {formData.price > 0 ? "Premium" : "Free"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Status and pricing feed the Test Overview sidebar within the public experience.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === "highlights" && (
                  <section className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">What Learners Receive</h2>
                        <p className="text-sm text-gray-600">
                          Control the highlight cards rendered in the "What You'll Get" section.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addHighlight}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        ➕ Add Highlight
                      </button>
                    </div>

                    <div className="space-y-4">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700">Icon</label>
                              <input
                                type="text"
                                value={highlight.icon}
                                onChange={(e) => updateHighlight(index, "icon", e.target.value)}
                                maxLength={10}
                                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="✨"
                              />
                            </div>
                            {highlights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeHighlight(index)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 mt-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Title *</label>
                              <input
                                type="text"
                                value={highlight.title}
                                onChange={(e) => updateHighlight(index, "title", e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Description *</label>
                              <textarea
                                value={highlight.description}
                                onChange={(e) => updateHighlight(index, "description", e.target.value)}
                                rows={2}
                                required
                                className="w-full resize-vertical rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {activeTab === "instructions" && (
                  <section className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Test Instructions</h2>
                        <p className="text-sm text-gray-600">
                          Manage the numbered checklist learners read before they begin.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addInstruction}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        ➕ Add Instruction
                      </button>
                    </div>

                    <div className="space-y-4">
                      {instructions.map((instruction, index) => (
                        <div key={`${index}-${(instruction || "").slice(0, 10)}`} className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                              {index + 1}
                            </span>
                            Step {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <textarea
                              value={instruction}
                              onChange={(e) => updateInstruction(index, e.target.value)}
                              rows={2}
                              className="w-full resize-vertical rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {instructions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInstruction(index)}
                                className="text-xs font-medium text-red-600 hover:underline"
                              >
                                Remove instruction
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {activeTab === "questions" && (
                  <section className="rounded-xl border border-gray-200 p-6">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Question Builder ({questions.length})</h2>
                        <p className="text-sm text-gray-600">
                          Update question text, answer options, and the correct answer index.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <span>➕</span>
                        <span>Add Question</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {questions.map((question, qIndex) => (
                        <div
                          key={qIndex}
                          className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Question {qIndex + 1}
                            </h3>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Question Text *
                            </label>
                            <textarea
                              value={question.text}
                              onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                              required
                              rows={3}
                              className="w-full resize-vertical rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <label className="text-sm font-medium text-gray-700">
                                Options *
                              </label>
                              {question.options.length < 6 && (
                                <button
                                  type="button"
                                  onClick={() => addOption(qIndex)}
                                  className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                  ➕ Add Option
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      newOptions[oIndex] = e.target.value;
                                      handleQuestionChange(qIndex, "options", newOptions);
                                    }}
                                    required
                                    placeholder={`Option ${oIndex + 1}`}
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(qIndex, oIndex)}
                                      className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Correct Answer *
                            </label>
                            <select
                              value={question.correctAnswer}
                              onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", Number(e.target.value))}
                              required
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {question.options.map((_, index) => (
                                <option key={index} value={index}>
                                  Option {index + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-8 py-6">
                <div className="text-sm text-gray-500">
                  {activeTab === "overview" && "Currently editing: Overview"}
                  {activeTab === "highlights" && "Currently editing: Highlights"}
                  {activeTab === "instructions" && "Currently editing: Instructions"}
                  {activeTab === "questions" && "Currently editing: Question Builder"}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Test"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
