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
import { Package, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [forecastData, setForecastData] = useState({
    historical: [],
    forecast: [],
  });
  const [reorderInfo, setReorderInfo] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [priceChange, setPriceChange] = useState(0);
  const [whatIfData, setWhatIfData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async (retries = 3) => {
      try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error("API not ready");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.warn("Backend waking up...", error);

        if (retries > 0) {
          setTimeout(() => fetchProducts(retries - 1), 10000); // retry after 10s
        } else {
          console.error("Backend unavailable");
        }
      }
    };

    fetchProducts();
  }, []);

  // Auto-select first product when products are loaded
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].product_id);
    }
  }, [products, selectedProduct]);

  // Fetch product details when selection changes
  useEffect(() => {
    if (!selectedProduct) return;

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const fetchJson = async (url) => {
          const res = await fetch(url);
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

        const [forecast, reorder, anomaly] = await Promise.all([
          fetchJson(`${API_URL}/forecast/${selectedProduct}`),
          fetchJson(`${API_URL}/reorder/${selectedProduct}`),
          fetchJson(`${API_URL}/anomalies/${selectedProduct}`),
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
        setAnomalies(anomaly?.anomalies ?? []);
      } catch (error) {
        console.error("Error fetching product data:", error);
        setForecastData({ historical: [], forecast: [] });
        setReorderInfo(null);
        setAnomalies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [selectedProduct]);

  const runWhatIfScenario = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/what-if`, {
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
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Healthy":
        return "bg-green-100 text-green-800";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800";
      case "Critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full px-6 py-8">
        {/* Header */}
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Smart Inventory Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered Demand Forecasting & Inventory Optimization
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {products.map((product) => (
            <div
              key={product.product_id}
              onClick={() => setSelectedProduct(product.product_id)}
              className={`p-5 rounded-xl shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedProduct === product.product_id
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl"
                  : "bg-white hover:shadow-xl"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Package
                  size={24}
                  className={
                    selectedProduct === product.product_id
                      ? "text-white"
                      : "text-indigo-600"
                  }
                />
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedProduct === product.product_id
                      ? "bg-white text-indigo-600"
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

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {reorderInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Current Stock
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reorderInfo.current_stock}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        units available
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Package className="text-blue-600" size={32} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Reorder Point
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reorderInfo.reorder_point}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        threshold level
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <AlertTriangle className="text-yellow-600" size={32} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Avg Daily Sales
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reorderInfo.avg_daily_sales}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        units per day
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="text-green-600" size={32} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-indigo-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Recommended Order
                      </p>
                      <p className="text-3xl font-bold text-indigo-600">
                        {reorderInfo.recommended_order_quantity}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        units to order
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <BarChart3 className="text-indigo-600" size={32} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forecast Chart */}
            {formatChartData().length > 0 && (
              <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={28} />
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
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      name="Actual Sales"
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      strokeDasharray="8 8"
                      dot={{ fill: "#8b5cf6", r: 4 }}
                      name="Predicted Sales"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* What-If Simulator */}
            <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                      className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-600 w-12">
                      +50%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-6 py-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">
                      Selected Change
                    </p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {priceChange}%
                    </p>
                  </div>
                  <button
                    onClick={runWhatIfScenario}
                    disabled={loading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Run Simulation
                  </button>
                </div>
              </div>

              {whatIfData && (
                <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        With a{" "}
                        <strong className="text-indigo-600">
                          {priceChange}%
                        </strong>{" "}
                        price change:
                      </p>
                      <p className="text-lg text-gray-800">
                        Expected demand change:{" "}
                        <strong className="text-indigo-600">
                          {whatIfData.demand_change_pct}%
                        </strong>
                      </p>
                    </div>
                    <div className="text-center px-6 py-4 bg-white rounded-xl shadow-md">
                      <p className="text-sm text-gray-600 mb-1">
                        Total Projected Demand
                      </p>
                      <p className="text-4xl font-bold text-indigo-600">
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

            {/* Anomalies */}
            {anomalies.length > 0 && (
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={28} />
                  Detected Anomalies
                </h2>
                <div className="space-y-3">
                  {anomalies.slice(0, 5).map((anomaly, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-4 bg-red-50 rounded-xl border-l-4 border-red-500 hover:bg-red-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(anomaly.ds).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700 text-lg">
                          {anomaly.y} units
                        </span>
                        <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-semibold">
                          Unusual
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
