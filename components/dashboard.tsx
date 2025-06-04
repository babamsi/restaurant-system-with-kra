"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import {
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  RefreshCcw,
  Laptop,
  Shirt,
  Home,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Custom hook for animated value
const useAnimatedValue = (targetValue: number, duration = 2000) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let startTime: number
    const animateValue = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setValue(Math.floor(progress * targetValue))
      if (progress < 1) {
        requestAnimationFrame(animateValue)
      }
    }
    requestAnimationFrame(animateValue)
  }, [targetValue, duration])

  return value
}

// Custom hook for simulating real-time account balance updates
const useAccountBalances = () => {
  const [balances, setBalances] = useState([
    { name: "Checking Account", balance: 5000 },
    { name: "Savings Account", balance: 10000 },
    { name: "Investment Account", balance: 25000 },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setBalances((prevBalances) =>
        prevBalances.map((account) => ({
          ...account,
          balance: Math.max(0, account.balance + Math.floor(Math.random() * 1000) - 500),
        })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return balances
}

// Generate random data for the charts
const generateData = (days: number) => {
  const data = []
  let sales = 20000
  let customers = 200
  for (let i = 0; i < days; i++) {
    sales += Math.floor(Math.random() * 2000) - 1000
    customers += Math.floor(Math.random() * 20) - 10
    data.push({
      day: `Day ${i + 1}`,
      sales,
      customers,
    })
  }
  return data
}

const lightModeContentColor = "text-[#392A17] dark:text-primary"
const lightModeTextColor = "text-[#392A17] dark:text-card-foreground"
const lightModeMutedColor = "text-[#392A17]/70 dark:text-muted-foreground"

export default function Dashboard({ className }: { className?: string }) {
  const { theme } = useTheme()
  const [data] = useState(() => generateData(30))
  const [transactions, setTransactions] = useState(
    [...Array(12)].map((_, index) => ({
      id: index,
      type: index % 2 === 0 ? "Payment Received" : "Refund Issued",
      amount: (Math.random() * 1000).toFixed(2),
      time: Math.floor(Math.random() * 60),
      customerName: `Customer ${index + 1}`,
    })),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prev) => {
        const newTransaction = {
          id: prev[prev.length - 1].id + 1,
          type: Math.random() > 0.5 ? "Payment Received" : "Refund Issued",
          amount: (Math.random() * 1000).toFixed(2),
          time: 0,
          customerName: `Customer ${prev[prev.length - 1].id + 2}`,
        }
        return [newTransaction, ...prev.slice(0, -1)].map((t) => ({
          ...t,
          time: t.time + 1,
        }))
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const totalSales = useAnimatedValue(data[data.length - 1].sales)
  const newCustomers = useAnimatedValue(data[data.length - 1].customers)

  return (
    <div
      className={cn(
        "relative w-full max-w-5xl rounded-2xl bg-gradient-to-br from-card via-card to-primary/10 dark:from-gray-800 dark:via-gray-800 dark:to-primary/5 p-6 shadow-lg transition-all duration-300 hover:shadow-xl",
        className,
      )}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-3xl font-bold ${lightModeTextColor}`}>Maamul Dashboard</h3>
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-background/50 dark:bg-gray-700/50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
            <h4 className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Total Sales
            </h4>
            <p className={`text-3xl font-bold ${lightModeContentColor}`}>${totalSales.toLocaleString()}</p>
            <div className="h-32 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" />
                  <XAxis dataKey="day" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "rgba(17, 24, 39, 0.8)", border: "none", borderRadius: "4px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke={theme === "dark" ? "#60a5fa" : "#8884d8"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-background/50 dark:bg-gray-700/50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
            <h4 className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              New Customers
            </h4>
            <p className={`text-3xl font-bold ${lightModeContentColor}`}>{newCustomers}</p>
            <div className="h-32 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" />
                  <XAxis dataKey="day" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "rgba(17, 24, 39, 0.8)", border: "none", borderRadius: "4px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="customers"
                    stroke={theme === "dark" ? "#60a5fa" : "#82ca9d"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-background/50 dark:bg-gray-700/50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
            <h4 className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-primary" />
              Account Balances
            </h4>
            <div className="space-y-4">
              {useAccountBalances().map((account, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium dark:text-gray-300">{account.name}</span>
                    <span className={`text-sm font-bold ${lightModeContentColor}`}>
                      ${account.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${(account.balance / 30000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className={`mt-4 text-xs ${lightModeContentColor} dark:text-blue-400 flex items-center`}>
              <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
              Updating in real-time
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow h-full">
          <div className="bg-background/50 dark:bg-gray-700/50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <h4 className={`text-lg font-semibold ${lightModeTextColor} mb-6 flex items-center`}>
              <BarChart3 className={`h-6 w-6 mr-3 ${lightModeContentColor}`} />
              Top Selling Categories
            </h4>
            <div className="space-y-6">
              {[
                {
                  category: "Electronics",
                  sales: 45000,
                  percentage: 70,
                  icon: <Laptop className={`w-5 h-5 ${lightModeContentColor}`} />,
                },
                {
                  category: "Clothing",
                  sales: 32000,
                  percentage: 50,
                  icon: <Shirt className={`w-5 h-5 ${lightModeContentColor}`} />,
                },
                {
                  category: "Home & Garden",
                  sales: 28000,
                  percentage: 43,
                  icon: <Home className={`w-5 h-5 ${lightModeContentColor}`} />,
                },
                {
                  category: "Books",
                  sales: 20000,
                  percentage: 31,
                  icon: <BookOpen className={`w-5 h-5 ${lightModeContentColor}`} />,
                },
              ].map((item, index) => (
                <div key={index} className="space-y-2 group">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium dark:text-gray-300 flex items-center">
                      <span className="mr-2">{item.icon}</span>
                      {item.category}
                    </span>
                    <p
                      className={`text-sm font-semibold ${theme === "light" ? "text-gray-800" : ""}`}
                    >{`${item.percentage}% (${item.sales})`}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="bg-[#392A17] dark:bg-primary h-3 rounded-full transition-all duration-500 ease-out group-hover:saturate-[1.2]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-background/50 dark:bg-gray-700/50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
            <h4 className={`text-sm font-medium ${lightModeMutedColor} mb-4 flex items-center`}>
              <Activity className={`h-5 w-5 mr-2 ${lightModeContentColor}`} />
              Real-time Transactions
            </h4>
            <div className="h-[300px] overflow-hidden relative">
              {transactions.slice(0, 8).map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="mb-3 p-3 rounded-md border border-primary/20 dark:border-gray-500/20 hover:bg-primary/5 dark:hover:bg-gray-600/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {transaction.type === "Payment Received" ? (
                        <ArrowUpRight className="h-5 w-5 mr-3 text-green-500" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 mr-3 text-red-500" />
                      )}
                      <div>
                        <span className={`text-sm font-medium ${lightModeTextColor}`}>{transaction.type}</span>
                        <p className={`${lightModeMutedColor}`}>
                          {transaction.customerName} • {transaction.time}{" "}
                          {transaction.time === 1 ? "minute" : "minutes"} ago
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${lightModeContentColor}`}>${transaction.amount}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
