"use client";
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { api } from "@/utils/api";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

export default function CreateTestPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const [formData, setFormData] = useState({
    testId: "",
    title: "",
    description: "",
    category: "polity",
    durationMinutes: 60,
    price: 0,
  });
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", options: ["", "", "", ""], correctAnswer: 0 },
  ]);
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
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "highlights", label: "Highlights", icon: "✨" },
    { id: "instructions", label: "Instructions", icon: "📝" },
    { id: "questions", label: "Questions", icon: "❓" },
  ];
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);

  // Calculate form completion progress
  const calculateProgress = () => {
    let completed = 0;
    let total = 0;

    // Overview tab
    total += 6;
    if (formData.testId.trim()) completed++;
    if (formData.title.trim()) completed++;
    if (formData.description.trim()) completed++;
    if (formData.category) completed++;
    if (formData.durationMinutes > 0) completed++;
    if (formData.price >= 0) completed++;

    // Highlights tab
    total += highlights.length;
    highlights.forEach(h => {
      if (h.title.trim() && h.description.trim()) completed++;
    });

    // Instructions tab
    total += instructions.length;
    instructions.forEach(i => {
      if (i.trim()) completed++;
    });

    // Questions tab
    total += questions.length * 3; // text, options, correctAnswer
    questions.forEach(q => {
      if (q.text.trim()) completed++;
      if (q.options.every(opt => opt.trim())) completed++;
      if (q.correctAnswer >= 0) completed++;
    });

    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "durationMinutes" || name === "price" ? Number(value) : value,
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

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploadError(null);
    setCsvUploadSuccess(false);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setCsvUploadError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvUploadError('CSV file must contain at least a header row and one question row');
          return;
        }

        // Parse CSV (handle quoted fields)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const importedQuestions: Question[] = [];
        const errors: string[] = [];

        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          
          if (row.length < 4) {
            errors.push(`Row ${i + 1}: Insufficient columns. Need at least: Question, Option1, Option2, CorrectAnswer`);
            continue;
          }

          const questionText = row[0].trim();
          if (!questionText) {
            errors.push(`Row ${i + 1}: Question text is required`);
            continue;
          }

          // Extract options (columns 1 to n-2, where n-1 is correct answer)
          const options: string[] = [];
          let correctAnswerIndex = row.length - 1;
          
          // Try to find correct answer column
          for (let j = 1; j < row.length - 1; j++) {
            const value = row[j].trim();
            if (value) {
              options.push(value);
            }
          }

          if (options.length < 2) {
            errors.push(`Row ${i + 1}: At least 2 options are required`);
            continue;
          }

          if (options.length > 6) {
            errors.push(`Row ${i + 1}: Maximum 6 options allowed`);
            continue;
          }

          // Parse correct answer (can be index number or option text)
          const correctAnswerValue = row[correctAnswerIndex].trim();
          let correctAnswer: number;

          // Try to parse as number first
          const numericAnswer = parseInt(correctAnswerValue);
          if (!isNaN(numericAnswer) && numericAnswer >= 0 && numericAnswer < options.length) {
            correctAnswer = numericAnswer;
          } else {
            // Try to find by option text
            const optionIndex = options.findIndex(opt => 
              opt.toLowerCase() === correctAnswerValue.toLowerCase()
            );
            if (optionIndex !== -1) {
              correctAnswer = optionIndex;
            } else {
              // Try to parse as letter (A=0, B=1, etc.)
              const letter = correctAnswerValue.toUpperCase();
              if (letter.length === 1 && letter >= 'A' && letter <= 'Z') {
                const letterIndex = letter.charCodeAt(0) - 65;
                if (letterIndex < options.length) {
                  correctAnswer = letterIndex;
                } else {
                  errors.push(`Row ${i + 1}: Invalid correct answer "${correctAnswerValue}"`);
                  continue;
                }
              } else {
                errors.push(`Row ${i + 1}: Invalid correct answer "${correctAnswerValue}"`);
                continue;
              }
            }
          }

          importedQuestions.push({
            text: questionText,
            options: options,
            correctAnswer: correctAnswer,
          });
        }

        if (importedQuestions.length === 0) {
          setCsvUploadError(errors.length > 0 ? errors.join('; ') : 'No valid questions found in CSV file');
          return;
        }

        // Add imported questions to existing questions
        setQuestions((prev) => [...prev, ...importedQuestions]);
        
        if (errors.length > 0) {
          setCsvUploadError(`Imported ${importedQuestions.length} questions. Some rows had errors: ${errors.join('; ')}`);
        } else {
          setCsvUploadSuccess(true);
          setTimeout(() => setCsvUploadSuccess(false), 3000);
        }

        // Reset file input
        e.target.value = '';
      } catch (err: any) {
        setCsvUploadError(`Error parsing CSV: ${err.message}`);
      }
    };

    reader.onerror = () => {
      setCsvUploadError('Error reading CSV file');
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.testId || !formData.title) {
      setError("Test ID and Title are required");
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

      const response = await api.admin.tests.create({
        testId: formData.testId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        durationMinutes: formData.durationMinutes,
        price: formData.price,
        highlights: preparedHighlights.length ? preparedHighlights : fallbackHighlights,
        instructions: preparedInstructions.length ? preparedInstructions : fallbackInstructions,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options,
          answer: q.correctAnswer,
        })),
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/tests");
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to create test");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 overflow-hidden">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Create and manage mock tests</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Create New Test
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Build a comprehensive mock test for your students
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Form Completion</span>
                  <span className="text-sm font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Enhanced Tabs */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 px-6 pt-6 pb-6">
                <nav className="flex gap-4 w-full">
                  {tabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 flex-1 ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                          : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6 md:p-8 pt-8">
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-800 px-5 py-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <strong className="font-semibold">Error:</strong> {error}
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-800 px-5 py-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">✅</span>
                      <div>
                        <strong className="font-semibold">Success!</strong> Test created successfully. Redirecting...
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "overview" && (
                  <section className="space-y-8 animate-fadeIn">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Overview</h2>
                      <p className="text-gray-600">
                        Provide the core information that shapes the public-facing hero card and quick stats for this test.
                      </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 space-y-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">📝</span>
                            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Test ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="testId"
                              value={formData.testId}
                              onChange={handleInputChange}
                              required
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="e.g., history-indus-valley"
                            />
                            <p className="text-xs text-gray-500">Unique identifier for this test</p>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              required
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="Ancient History - Indus Valley Civilization"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Description
                            </label>
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              rows={4}
                              className="w-full resize-vertical rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="Questions on ancient Indian history and civilizations"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-6 space-y-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">⚙️</span>
                            <h3 className="text-lg font-semibold text-gray-900">Test Settings</h3>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="category"
                              value={formData.category}
                              onChange={handleInputChange}
                              required
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            >
                              <option value="polity">🏛️ Polity</option>
                              <option value="history">📜 History</option>
                              <option value="geography">🌎 Geography</option>
                              <option value="economy">📊 Economy</option>
                              <option value="science">🧪 Science</option>
                              <option value="current-affairs">📰 Current Affairs</option>
                            </select>
                          </div>

                          <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                Duration (minutes) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                name="durationMinutes"
                                value={formData.durationMinutes}
                                onChange={handleInputChange}
                                required
                                min={1}
                                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                Price (₹) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                required
                                min={0}
                                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>

                          {/* Access Type Badge */}
                          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-r from-white to-gray-50 px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-900 flex items-center gap-2">
                                <span>🔒</span>
                                Access Type
                              </span>
                              <span className={`px-4 py-1.5 rounded-full font-bold text-sm ${
                                formData.price > 0 
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" 
                                  : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                              }`}>
                                {formData.price > 0 ? "💎 Premium" : "🆓 Free"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              This label appears in the test overview widget
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === "highlights" && (
                  <section className="space-y-6 animate-fadeIn">
                    <div className="flex items-start justify-between gap-4 border-l-4 border-purple-500 pl-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">What Learners Receive</h2>
                        <p className="text-gray-600">
                          Curate highlight cards that appear in the "What You'll Get" section of the test detail page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addHighlight}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        <span>➕</span>
                        <span>Add Highlight</span>
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-semibold text-gray-700">Icon</label>
                              <input
                                type="text"
                                value={highlight.icon}
                                onChange={(e) => updateHighlight(index, "icon", e.target.value)}
                                maxLength={10}
                                className="w-24 rounded-lg border-2 border-gray-300 px-3 py-2 text-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="✨"
                              />
                            </div>
                            {highlights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeHighlight(index)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                              >
                                🗑️ Remove
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Title <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={highlight.title}
                                onChange={(e) => updateHighlight(index, "title", e.target.value)}
                                required
                                className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="Comprehensive Question Bank"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
                              <textarea
                                value={highlight.description}
                                onChange={(e) => updateHighlight(index, "description", e.target.value)}
                                rows={3}
                                required
                                className="w-full resize-vertical rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="3 carefully curated questions covering all important topics"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {activeTab === "instructions" && (
                  <section className="space-y-6 animate-fadeIn">
                    <div className="flex items-start justify-between gap-4 border-l-4 border-green-500 pl-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Instructions</h2>
                        <p className="text-gray-600">
                          Outline the guidance learners see before starting the test.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addInstruction}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        <span>➕</span>
                        <span>Add Instruction</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {instructions.map((instruction, index) => (
                        <div key={`${index}-${(instruction || "").slice(0, 10)}`} className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white to-green-50/30 p-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 text-sm font-bold text-green-600">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                              {index + 1}
                            </span>
                            Step {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <textarea
                              value={instruction}
                              onChange={(e) => updateInstruction(index, e.target.value)}
                              rows={2}
                              className="w-full resize-vertical rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                              placeholder="Describe the instruction shown to learners"
                            />
                            {instructions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInstruction(index)}
                                className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                              >
                                🗑️ Remove instruction
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {activeTab === "questions" && (
                  <section className="space-y-6 animate-fadeIn">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-l-4 border-orange-500 pl-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Question Builder <span className="text-orange-600">({questions.length})</span>
                        </h2>
                        <p className="text-gray-600">
                          Configure the question bank. Each question can have between 2 and 6 options with one correct answer.
                        </p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <label className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer whitespace-nowrap">
                          <span className="text-lg">📤</span>
                          <span>Upload CSV</span>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleCsvUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
                        >
                          <span className="text-lg">➕</span>
                          <span>Add Question</span>
                        </button>
                      </div>
                    </div>

                    {/* CSV Upload Messages */}
                    {csvUploadError && (
                      <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-5 py-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⚠️</span>
                          <div>
                            <strong className="font-semibold">CSV Upload Error:</strong> {csvUploadError}
                          </div>
                        </div>
                      </div>
                    )}

                    {csvUploadSuccess && (
                      <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-5 py-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">✅</span>
                          <div>
                            <strong className="font-semibold">Success!</strong> Questions imported successfully from CSV.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CSV Format Help */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 mb-2">CSV Format Guide</h3>
                          <p className="text-sm text-blue-800 mb-2">
                            Your CSV file should have the following format (with header row):
                          </p>
                          <div className="bg-white rounded p-3 text-xs font-mono text-gray-700 overflow-x-auto">
                            Question,Option1,Option2,Option3,Option4,CorrectAnswer
                          </div>
                          <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                            <li>First column: Question text</li>
                            <li>Next columns: Options (2-6 options required)</li>
                            <li>Last column: Correct answer (can be index number 0-5, letter A-F, or option text)</li>
                            <li>Example: "What is 2+2?","3","4","5","6","1" or "What is 2+2?","3","4","5","6","B"</li>
                          </ul>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              // Create sample CSV content
                              const sampleCSV = `Question,Option1,Option2,Option3,Option4,CorrectAnswer
"What is the capital of India?","Mumbai","Delhi","Kolkata","Chennai","1"
"Which article defines India as a Union of States?","Art 1","Art 2","Art 3","Art 5","0"
"How many fundamental rights are in Indian Constitution?","5","6","7","8","1"`;
                              const blob = new Blob([sampleCSV], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'sample-questions.csv';
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                            className="text-blue-600 hover:text-blue-800 underline text-xs mt-2 inline-block"
                          >
                            📥 Download Sample CSV Template
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {questions.map((question, qIndex) => (
                        <div
                          key={qIndex}
                          className="space-y-5 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b-2 border-gray-200">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg">
                                {qIndex + 1}
                              </span>
                              <h3 className="text-lg font-bold text-gray-900">
                                Question {qIndex + 1}
                              </h3>
                            </div>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                              >
                                <span>🗑️</span>
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Question Text <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={question.text}
                              onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                              required
                              rows={3}
                              className="w-full resize-vertical rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                              placeholder="Enter the question prompt"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <label className="text-sm font-semibold text-gray-700">
                                Options <span className="text-red-500">*</span>
                              </label>
                              {question.options.length < 6 && (
                                <button
                                  type="button"
                                  onClick={() => addOption(qIndex)}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                  <span>➕</span>
                                  <span>Add Option</span>
                                </button>
                              )}
                            </div>
                            <div className="space-y-3">
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                      question.correctAnswer === oIndex
                                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                        : "bg-gray-200 text-gray-600"
                                    }`}>
                                      {String.fromCharCode(65 + oIndex)}
                                    </span>
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
                                      className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                    />
                                  </div>
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(qIndex, oIndex)}
                                      className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Correct Answer <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={question.correctAnswer}
                              onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", Number(e.target.value))}
                              required
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                            >
                              {question.options.map((_, index) => (
                                <option key={index} value={index}>
                                  Option {index + 1} ({String.fromCharCode(65 + index)})
                                </option>
                              ))}
                            </select>
                            {question.correctAnswer >= 0 && (
                              <p className="text-xs text-green-600 font-medium mt-1">
                                ✓ Correct answer: {String.fromCharCode(65 + question.correctAnswer)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Enhanced Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 px-6 md:px-8 py-6">
                <div className="text-sm text-gray-600 font-medium">
                  {activeTab === "overview" && "📋 Currently editing: Overview"}
                  {activeTab === "highlights" && "✨ Currently editing: Highlights"}
                  {activeTab === "instructions" && "📝 Currently editing: Instructions"}
                  {activeTab === "questions" && "❓ Currently editing: Question Builder"}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/tests")}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Creating...</span>
                      </>
                    ) : success ? (
                      <>
                        <span>✅</span>
                        <span>Created!</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Create Test</span>
                      </>
                    )}
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
