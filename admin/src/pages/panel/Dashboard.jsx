import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Chart.js Imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// --- Data Objects ---

const kpiData = [
  { label: "Total Revenue", value: 1425000, prefix: "₹", icon: "lucide:indian-rupee" },
  { label: "Active Orders", value: 142, icon: "solar:box-minimalistic-linear" },
  { label: "Conversion Rate", value: 3.8, suffix: "%", icon: "lucide:trending-up" },
  { label: "Unique Visitors", value: 18400, icon: "solar:users-group-rounded-linear" },
];

const recentOrders = [
  { id: "#MR-0092", customer: "Elena Rostova", date: "Today, 10:42 AM", amount: "₹12,500.00", status: "Processing" },
  { id: "#MR-0091", customer: "Marcus Vance", date: "Today, 09:15 AM", amount: "₹8,400.00", status: "Shipped" },
  { id: "#MR-0090", customer: "Sophia Chen", date: "Yesterday", amount: "₹31,000.00", status: "Delivered" },
  { id: "#MR-0089", customer: "James Holden", date: "Yesterday", amount: "₹4,500.00", status: "Processing" },
];

const topProducts = [
  { name: "Obsidian Terracotta Vase", category: "Vases", sold: 245, revenue: "₹2,85,000" },
  { name: "Ivory Ceramic Lamp", category: "Lighting", sold: 182, revenue: "₹4,52,000" },
  { name: "Minimalist Matcha Bowl", category: "Dinnerware", sold: 134, revenue: "₹1,24,000" },
  { name: "Sculptural Centerpiece", category: "Decor", sold: 98, revenue: "₹3,40,000" },
];

const trafficSources = [
  { label: "Organic Search", percentage: 45, color: "bg-[var(--dark)]" },
  { label: "Instagram & Social", percentage: 32, color: "bg-[var(--dark)]/60" },
  { label: "Direct Traffic", percentage: 18, color: "bg-[var(--dark)]/30" },
  { label: "Referral & PR", percentage: 5, color: "bg-[var(--dark)]/10" },
];

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Revenue',
      data: [85000, 110000, 95000, 145000, 120000, 180000, 165000, 190000, 240000, 210000, 290000, 340000],
      borderColor: '#7e7053',
      backgroundColor: 'rgba(126, 112, 83, 0.15)',
      borderWidth: 2,
      tension: 0.4, 
      fill: true,
      pointBackgroundColor: '#171410', 
      pointBorderColor: '#f8f8f8', 
      pointHoverRadius: 6,
      pointRadius: 0, 
      pointHitRadius: 20,
    }
  ]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 2000,
    easing: 'easeOutQuart'
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#171410',
      titleFont: { family: 'Inter', size: 11 },
      bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
      padding: 12,
      cornerRadius: 6,
      displayColors: false, 
      callbacks: {
        label: function(context) {
          // Format with Indian Rupee system
          return '₹' + context.parsed.y.toLocaleString('en-IN');
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { font: { family: 'Inter', size: 10 }, color: '#171410', padding: 10 }
    },
    y: {
      grid: { color: 'rgba(23, 20, 16, 0.05)', drawBorder: false }, 
      ticks: { 
        font: { family: 'Inter', size: 10 }, 
        color: '#171410', 
        callback: (value) => '₹' + (value / 1000) + 'k', 
        padding: 10
      }
    }
  },
  interaction: { mode: 'index', intersect: false },
};

const Dashboard = () => {
  const containerRef = useRef(null);
  const { admin } = useSelector((state) => state.auth);

  useGSAP(() => {
    
    // Header
    gsap.fromTo(".dash-header", 
      { y: 30, autoAlpha: 0 }, 
      { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }
    );

    // KPI Cards
    gsap.fromTo(".kpi-card", 
      { y: 30, autoAlpha: 0 }, 
      { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, delay: 0.2, ease: "power3.out" }
    );

    // Chart Container
    gsap.fromTo(".chart-container", 
      { y: 30, autoAlpha: 0 }, 
      { y: 0, autoAlpha: 1, duration: 0.8, delay: 0.4, ease: "power3.out" }
    );

    // Top Products
    gsap.fromTo(".top-products-container", 
      { y: 30, autoAlpha: 0 }, 
      { y: 0, autoAlpha: 1, duration: 0.8, delay: 0.5, ease: "power3.out" }
    );
    gsap.fromTo(".top-product-row", 
      { x: -15, autoAlpha: 0 }, 
      { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, delay: 0.6, ease: "power3.out" }
    );

    // Orders
    gsap.fromTo(".orders-container", 
      { y: 30, autoAlpha: 0 }, 
      { y: 0, autoAlpha: 1, duration: 0.8, delay: 0.4, ease: "power3.out" }
    );
    gsap.fromTo(".table-row", 
      { x: -20, autoAlpha: 0 }, 
      { x: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, delay: 0.5, ease: "power3.out" }
    );

    // Traffic Sources
    gsap.fromTo(".traffic-container", 
      { y: 30, autoAlpha: 0 }, 
      { y: 0, autoAlpha: 1, duration: 0.8, delay: 0.6, ease: "power3.out" }
    );
    gsap.fromTo(".traffic-row", 
      { x: -15, autoAlpha: 0 }, 
      { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, delay: 0.7, ease: "power3.out" }
    );
    
    // Progress Bar Animation
    gsap.fromTo(".progress-bar-fill", 
      { width: "0%" }, 
      { width: (i, el) => el.dataset.width, duration: 1.5, delay: 0.9, ease: "power3.out" }
    );

    // Number ticker logic (Uses en-IN for Indian comma formatting)
    gsap.utils.toArray(".kpi-value", containerRef.current).forEach((el, index) => {
      const targetValue = kpiData[index].value;
      const isDecimal = targetValue % 1 !== 0;
      const proxy = { val: 0 }; 
      
      gsap.to(proxy, { 
        val: targetValue, 
        duration: 2, 
        ease: "power3.out",
        delay: 0.2 + (index * 0.1),
        onUpdate: () => {
          el.innerText = isDecimal 
            ? proxy.val.toFixed(1)
            : Math.floor(proxy.val).toLocaleString('en-IN'); 
        }
      });
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="w-full">
      
      {/* THE FIX: flex-col for mobile, md:flex-row for desktop, gap-4 added */}
      <header className="dash-header invisible mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-5 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[var(--dark)]/20 to-transparent"></div>
        <div>
          <h1 className="head-font text-4xl txt-dark tracking-tight mb-2">Command Center</h1>
          <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase txt-dark opacity-50">
            Welcome back, {admin?.name || "Admin"}
          </p>
        </div>
        
        {/* THE FIX: align left on mobile, self-start keeps it compact */}
        <div className="text-left md:text-right self-start md:self-auto">
          <p className="inline-block text-[0.65rem] uppercase tracking-[0.1em] txt-dark font-mono bg-white shadow-sm border border-[var(--dark)]/5 px-4 py-2 rounded-full">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
        {kpiData.map((kpi, index) => (
          <div key={index} className="kpi-card invisible h-full">
            <div className="relative h-full group p-7 bg-white border border-[var(--dark)]/5 rounded-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(23,20,16,0.08)] cursor-default overflow-hidden">
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent transition-all duration-500 group-hover:w-full"></div>
              
              <div className="flex justify-between items-start mb-8">
                <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase txt-dark opacity-50">
                  {kpi.label}
                </p>
                <div className="p-2 bg-[var(--dark)]/5 rounded-md group-hover:bg-[var(--dark)]/10 transition-colors duration-500">
                  <Icon icon={kpi.icon} className="text-lg txt-dark opacity-70" />
                </div>
              </div>
              
              <div className="flex items-baseline gap-1">
                {kpi.prefix && <span className="text-lg txt-dark opacity-50">{kpi.prefix}</span>}
                <h3 className="head-font text-4xl txt-dark tracking-tight">
                  <span className="kpi-value">0</span>
                </h3>
                {kpi.suffix && <span className="text-lg txt-dark opacity-50">{kpi.suffix}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT COLUMN: Chart + Top Products */}
        <div className="lg:col-span-2 flex flex-col gap-12">
          
          {/* Chart Section */}
          <div className="chart-container invisible">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="head-font text-2xl txt-dark tracking-tight">Revenue Trajectory</h2>
              <button className="text-[0.6rem] font-bold tracking-[0.2em] uppercase txt-dark border-b border-[var(--dark)]/20 hover:border-[var(--dark)] hover:text-accent transition-all pb-1">
                View Report
              </button>
            </div>
            <div className="w-full h-[360px] bg-white border border-[var(--dark)]/5 rounded-lg p-6 shadow-sm">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Top Products Section */}
          <div className="top-products-container invisible">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="head-font text-2xl txt-dark tracking-tight">Top Performing Pieces</h2>
              <button className="text-[0.6rem] font-bold tracking-[0.2em] uppercase txt-dark border-b border-[var(--dark)]/20 hover:border-[var(--dark)] hover:text-accent transition-all pb-1">
                View Inventory
              </button>
            </div>
            
            <div className="bg-white border border-[var(--dark)]/5 rounded-lg overflow-hidden shadow-sm flex flex-col">
              {topProducts.map((product, index) => (
                <div key={index} className="top-product-row invisible flex justify-between items-center p-5 border-b border-[var(--dark)]/5 last:border-0 hover:bg-[var(--dark)]/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4 transition-transform duration-300 group-hover:translate-x-1">
                    <div className="w-11 h-11 bg-[var(--dark)]/5 rounded-md flex items-center justify-center group-hover:bg-[var(--dark)]/10 transition-colors">
                      <Icon icon="solar:box-minimalistic-linear" className="text-xl txt-dark opacity-50" />
                    </div>
                    <div>
                      <p className="text-sm font-bold txt-dark">{product.name}</p>
                      <p className="text-[0.6rem] tracking-[0.1em] uppercase txt-dark opacity-40 mt-1">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end transition-transform duration-300 group-hover:-translate-x-1">
                    <p className="text-sm font-bold txt-dark">{product.revenue}</p>
                    <p className="text-[0.65rem] tracking-[0.05em] txt-dark opacity-50 mt-1">{product.sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Latest Dispatches + Traffic */}
        <div className="lg:col-span-1 flex flex-col gap-12">
          
          {/* Recent Orders Section */}
          <div className="orders-container invisible">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="head-font text-2xl txt-dark tracking-tight">Latest Dispatches</h2>
            </div>
            
            <div className="flex flex-col gap-2">
              {recentOrders.map((order, index) => (
                <div key={index} className="table-row invisible">
                  <div className="group p-4 border border-[var(--dark)]/5 bg-white rounded-lg hover:bg-[var(--dark)]/[0.02] transition-all duration-300 cursor-pointer flex justify-between items-center">
                    <div className="flex flex-col transition-transform duration-300 group-hover:translate-x-2">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[0.65rem] font-mono txt-dark opacity-50">
                          {order.id}
                        </p>
                        <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Processing' ? 'bg-accent' : 'bg-green-500'}`}></span>
                      </div>
                      <p className="text-sm font-bold txt-dark">
                        {order.customer}
                      </p>
                      <p className="text-[0.6rem] tracking-[0.1em] uppercase txt-dark opacity-40 mt-1">
                        {order.date}
                      </p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end justify-center transition-transform duration-300 group-hover:-translate-x-1">
                      <p className="text-sm txt-dark font-medium">
                        {order.amount}
                      </p>
                      <Icon icon="lucide:arrow-right" className="text-xs txt-dark opacity-0 group-hover:opacity-40 transition-opacity duration-300 mt-2 -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acquisition Channels (Traffic) Section */}
          <div className="traffic-container invisible">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="head-font text-2xl txt-dark tracking-tight">Acquisition Channels</h2>
            </div>
            
            <div className="bg-white border border-[var(--dark)]/5 rounded-lg p-6 shadow-sm flex flex-col gap-6">
              {trafficSources.map((source, index) => (
                <div key={index} className="traffic-row invisible">
                  <div className="flex justify-between text-xs font-bold txt-dark mb-2">
                    <span className="opacity-70">{source.label}</span>
                    <span>{source.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--dark)]/5 rounded-full overflow-hidden">
                    <div 
                      className={`progress-bar-fill h-full ${source.color} rounded-full`}
                      data-width={`${source.percentage}%`}
                      style={{ width: "0%" }} // Forces pure 0 on load for GSAP
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;