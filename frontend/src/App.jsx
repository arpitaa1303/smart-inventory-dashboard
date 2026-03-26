import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
  CheckCircle,
} from "lucide-react";
import Landing from "./Landing";
import Loading from "./Loading";

const API_URL = import.meta.env.VITE_API_URL;
const FETCH_TIMEOUT_MS = 15000;
const MAX_WAKE_ATTEMPTS = 15;
const WAKE_RETRY_DELAY_MS = 8000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [forecastData, setForecastData] = useState({
    historical: [],
    forecast: [],
  });
  const [reorderInfo, setReorderInfo] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [whatIfData, setWhatIfData] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    if (showLanding) return;

    if (!API_URL) {
      console.error("VITE_API_URL is not set");
      alert("App configuration is missing VITE_API_URL. Please check deployment env vars.");
      setIsInitialLoading(false);
      return;
    }

    let isCancelled = false;
    let retryTimer = null;

    const fetchProducts = async (attempt = 1) => {
      try {
        // Warm the backend and verify it's ready before data calls.
        await fetchWithTimeout(`${API_URL}/health`);
        const response = await fetchWithTimeout(`${API_URL}/products`);
        if (!response.ok) throw new Error("API not ready");
        const data = await response.json();
        if (isCancelled) return;
        setProducts(data);
        setIsInitialLoading(false);
      } catch (error) {
        console.warn(
          `Backend waking up... (${attempt}/${MAX_WAKE_ATTEMPTS} attempts)`,
          error,
        );

        if (attempt < MAX_WAKE_ATTEMPTS) {
          retryTimer = setTimeout(
            () => fetchProducts(attempt + 1),
            WAKE_RETRY_DELAY_MS,
          );
        } else {
          console.error(`Backend unavailable after ${MAX_WAKE_ATTEMPTS} attempts`);
          alert(
            "Unable to connect to server. Please refresh the page or try again later.",
          );
          if (!isCancelled) {
            setIsInitialLoading(false);
          }
        }
      }
    };

    fetchProducts();

    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [showLanding]);

  // Auto-select first product when products are loaded
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].product_id);
    }
  }, [products, selectedProduct]);

  // Fetch product details when selection changes
  useEffect(() => {
    if (!selectedProduct || isInitialLoading) return;

    const fetchProductDetails = async () => {
      setIsActionLoading(true);
      try {
        const fetchJson = async (url) => {
          const res = await fetchWithTimeout(url);
          if (!res.ok) {
            console.warn("Non-OK response for", url, res.status);
            return null;
          }
          try {
            return await res.json();
          } catch (err) {
            console.warn("Failed to parse JSON from", url, err);
            return null;
          }
        };

        const [forecast, reorder] = await Promise.all([
          fetchJson(`${API_URL}/forecast/${selectedProduct}`),
          fetchJson(`${API_URL}/reorder/${selectedProduct}`),
        ]);

        if (
          forecast &&
          typeof forecast === "object" &&
          Array.isArray(forecast.historical) &&
          Array.isArray(forecast.forecast)
        ) {
          setForecastData(forecast);
        } else {
          setForecastData({ historical: [], forecast: [] });
        }

        setReorderInfo(reorder || null);
      } catch (error) {
        console.error("Error fetching product data:", error);
        setForecastData({ historical: [], forecast: [] });
        setReorderInfo(null);
      } finally {
        setIsActionLoading(false);
      }
    };

    fetchProductDetails();
  }, [selectedProduct, isInitialLoading]);

  const runWhatIfScenario = async () => {
    if (!selectedProduct) return;

    setIsActionLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct,
          price_change_pct: priceChange,
          days: 30,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWhatIfData(data);
    } catch (error) {
      console.error("Error running what-if:", error);
      alert("Failed to run simulation. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Healthy":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Low Stock":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const calculateInventoryHealth = () => {
    if (!products.length) return 0;
    const healthyCount = products.filter((p) => p.status === "Healthy").length;
    return Math.round((healthyCount / products.length) * 100);
  };

  const getStockAlerts = () => {
    return products.filter(
      (p) => p.status === "Low Stock" || p.status === "Critical",
    );
  };

  const formatChartData = () => {
    if (
      !forecastData ||
      !forecastData.historical ||
      !forecastData.forecast ||
      !Array.isArray(forecastData.historical) ||
      !Array.isArray(forecastData.forecast)
    ) {
      return [];
    }

    const historical = forecastData.historical.map((item) => ({
      date: new Date(item.ds).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      actual: item.y,
      type: "historical",
    }));

    const forecast = forecastData.forecast.map((item) => ({
      date: new Date(item.ds).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      predicted: Math.round(item.yhat),
      lower: Math.round(item.yhat_lower),
      upper: Math.round(item.yhat_upper),
      type: "forecast",
    }));

    return [...historical.slice(-60), ...forecast];
  };

  // Show landing page
  if (showLanding) {
    return <Landing onGetStarted={() => setShowLanding(false)} />;
  }

  // Show loading screen while fetching initial data
  if (isInitialLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-gray-100 to-teal-50">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-3 tracking-tight">
            Smart Inventory Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered Demand Forecasting & Inventory Optimization
          </p>
        </div>

        {/* Inventory Health & Alerts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Inventory Health Score */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Inventory Health
              </h3>
              <Activity className="text-teal-600" size={24} />
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold text-gray-800">
                {calculateInventoryHealth()}%
              </span>
              <span className="text-gray-600 mb-2">overall health</span>
            </div>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${calculateInventoryHealth()}%` }}
              />
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Stock Alerts</h3>
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <div className="space-y-2">
              {getStockAlerts().length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">All stock levels healthy</span>
                </div>
              ) : (
                getStockAlerts()
                  .slice(0, 3)
                  .map((product) => (
                    <div
                      key={product.product_id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm text-gray-700">
                        {product.product_name}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}
                      >
                        {product.status}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {products.map((product) => (
            <div
              key={product.product_id}
              onClick={() => setSelectedProduct(product.product_id)}
              className={`p-5 rounded-xl shadow-md cursor-pointer transition-all duration-300 transform hover:scale-105 border ${
                selectedProduct === product.product_id
                  ? "bg-teal-600 text-white shadow-xl border-teal-700"
                  : "bg-white hover:shadow-lg border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Package
                  size={24}
                  className={
                    selectedProduct === product.product_id
                      ? "text-white"
                      : "text-teal-600"
                  }
                />
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedProduct === product.product_id
                      ? "bg-white text-teal-600"
                      : getStatusColor(product.status)
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <h3 className="font-bold text-base mb-2">
                {product.product_name}
              </h3>
              <p className="text-sm opacity-90">
                Stock: {product.current_stock} units
              </p>
            </div>
          ))}
        </div>

        {isActionLoading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-teal-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {reorderInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-teal-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Current Stock
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {reorderInfo.current_stock}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        units available
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-xl">
                      <Package className="text-teal-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-amber-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Reorder Point
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {reorderInfo.reorder_point}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        threshold level
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <AlertTriangle className="text-amber-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Avg Daily Sales
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {reorderInfo.avg_daily_sales}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        units per day
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <TrendingUp className="text-emerald-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-slate-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Recommended Order
                      </p>
                      <p className="text-3xl font-bold text-teal-600">
                        {reorderInfo.recommended_order_quantity}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        units to order
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <BarChart3 className="text-slate-600" size={28} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forecast Chart */}
            {formatChartData().length > 0 && (
              <div className="bg-white p-8 rounded-2xl shadow-md mb-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-teal-600" size={28} />
                  Demand Forecast (Next 30 Days)
                </h2>
                <ResponsiveContainer width="100%" height={450}>
                  <LineChart
                    data={formatChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#0d9488"
                      strokeWidth={3}
                      dot={{ fill: "#0d9488", r: 4 }}
                      name="Actual Sales"
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#475569"
                      strokeWidth={3}
                      strokeDasharray="8 8"
                      dot={{ fill: "#475569", r: 4 }}
                      name="Predicted Sales"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* What-If Simulator */}
            <div className="bg-white p-8 rounded-2xl shadow-md mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                What-If Scenario Simulator
              </h2>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex-1 w-full">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Price Change Percentage:
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-12">
                      -50%
                    </span>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={priceChange}
                      onChange={(e) => setPriceChange(Number(e.target.value))}
                      className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <span className="text-sm font-medium text-gray-600 w-12">
                      +50%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-6 py-3 bg-teal-50 rounded-xl border border-teal-100">
                    <p className="text-xs text-gray-600 mb-1">
                      Selected Change
                    </p>
                    <p className="text-3xl font-bold text-teal-600">
                      {priceChange}%
                    </p>
                  </div>
                  <button
                    onClick={runWhatIfScenario}
                    disabled={isActionLoading}
                    className="bg-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-teal-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Run Simulation
                  </button>
                </div>
              </div>

              {whatIfData && (
                <div className="mt-6 p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        With a{" "}
                        <strong className="text-teal-600">
                          {priceChange}%
                        </strong>{" "}
                        price change:
                      </p>
                      <p className="text-lg text-gray-800">
                        Expected demand change:{" "}
                        <strong className="text-teal-600">
                          {whatIfData.demand_change_pct}%
                        </strong>
                      </p>
                    </div>
                    <div className="text-center px-6 py-4 bg-white rounded-xl shadow-md border border-gray-100">
                      <p className="text-sm text-gray-600 mb-1">
                        Total Projected Demand
                      </p>
                      <p className="text-4xl font-bold text-teal-600">
                        {Math.round(
                          whatIfData.forecast.reduce(
                            (sum, item) => sum + item.yhat,
                            0,
                          ),
                        )}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        units (30 days)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
