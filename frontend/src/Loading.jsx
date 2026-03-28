import React from "react";
import { Package } from "lucide-react";

function Loading({ message = "Loading Dashboard" }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-gray-100 to-teal-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-lg mb-8 animate-pulse">
          <Package className="w-12 h-12 text-teal-600" />
        </div>

        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-teal-600"></div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">{message}</h2>
        <p className="text-gray-600 mb-2">Waking up the server...</p>
        <p className="text-sm text-gray-500">
          This may take up to 60 seconds on first load
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div
            className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Loading;
