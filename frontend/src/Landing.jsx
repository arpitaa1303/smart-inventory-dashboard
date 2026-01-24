import React from "react";
import {
  Package,
  TrendingUp,
  BarChart3,
  Zap,
  Shield,
  Target,
} from "lucide-react";

function Landing({ onGetStarted }) {
  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Demand Forecasting",
      description:
        "AI-powered predictions for the next 30 days based on historical sales data and trends.",
      color: "bg-teal-50 text-teal-600",
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Smart Reordering",
      description:
        "Automated reorder point calculations to prevent stockouts and optimize inventory levels.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "What-If Analysis",
      description:
        "Simulate price changes and see their impact on demand before making decisions.",
      color: "bg-slate-50 text-slate-600",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Analytics",
      description:
        "Monitor inventory health, sales velocity, and stock status across all products.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Stock Alerts",
      description:
        "Get notified when inventory reaches critical levels to maintain optimal stock.",
      color: "bg-rose-50 text-rose-600",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Performance Metrics",
      description:
        "Track key inventory KPIs including turnover rate, days of supply, and more.",
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-2xl mb-6">
            <Package className="w-10 h-10 text-teal-600" />
          </div>

          <h1 className="text-6xl font-bold text-gray-800 mb-4 tracking-tight">
            Smart Inventory Dashboard
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            AI-Powered Demand Forecasting & Inventory Optimization Platform
          </p>

          <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
            Leverage machine learning to predict demand, optimize stock levels,
            and make data-driven inventory decisions. Reduce costs, prevent
            stockouts, and improve operational efficiency.
          </p>

          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-teal-600 text-white rounded-xl font-semibold text-lg hover:bg-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started →
          </button>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} rounded-xl mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 text-teal-600 rounded-full font-bold text-2xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Select a Product
              </h3>
              <p className="text-gray-600">
                Choose from your inventory to view detailed analytics and
                forecasts
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full font-bold text-2xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Review Insights
              </h3>
              <p className="text-gray-600">
                Analyze demand forecasts, reorder recommendations, and key
                metrics
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 text-slate-600 rounded-full font-bold text-2xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Make Decisions
              </h3>
              <p className="text-gray-600">
                Use what-if scenarios and data to optimize your inventory
                strategy
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            Ready to optimize your inventory management?
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-slate-700 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Launch Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
