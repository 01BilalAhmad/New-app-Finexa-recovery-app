'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Lock, MapPin, LayoutDashboard, BookOpen, Phone, Eye, EyeOff,
  Search, RefreshCw, Wifi, WifiOff, Check, AlertTriangle, Navigation,
  FileText, ArrowLeft, Plus, X, ChevronRight, IndianRupee, Send,
  MessageSquare, Share2, Download, Edit3, Trash2, LogOut, Camera,
  Map, BarChart3, PieChart as PieChartIcon, Home, Store, Calendar,
  MapPinned, Route, ClipboardList, Image as ImageIcon, Shield, StickyNote,
  Target, Clock, TrendingUp, Building2, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

// ==================== TYPES ====================
interface UserObj {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: string;
  phone?: string;
  status?: string;
  allRoutesEnabled?: boolean;
  companyId?: string;
  companies?: { companyId: string; companyName: string; isPrimary: boolean }[];
}

interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  area: string;
  address: string;
  balance: number;
  creditLimit: number;
  lat: number;
  lng: number;
  routeDays: string[];
  orderbookerId: string;
  status: string;
  visited: boolean; // derived client-side from ShopVisit/RouteShopVisit
  lastVisitDate: string;
  companyBalances?: { id: string; companyId: string; balance: number; creditLimit: number; company?: { id: string; name: string } }[];
  assignedOrderbookers?: { id: string; orderbookerId: string; companyId: string; routeDays: string[] }[];
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  shopId: string;
  type: string;
  status: string; // "pending", "approved", "rejected"
  amount: number;
  previousBalance: number;
  newBalance: number;
  createdBy: string;
  description: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectReason?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAddress?: string | null;
  companyId?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  shop?: Shop;
  creator?: { id: string; name: string; username: string };
  company?: Company;
}

interface LedgerData {
  shop: Shop;
  transactions: Transaction[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    balance: number;
  };
}

interface Company {
  id: string;
  name: string;
  description?: string;
  distributorPhone?: string;
  status: string;
  isPrimary?: boolean;
}

interface ShopNote {
  id: string;
  shopId: string;
  note: string; // website uses 'note' field
  createdBy: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShopVisit {
  id: string;
  shopId: string;
  orderbookerId: string;
  orderbookerName?: string;
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAddress?: string | null;
  inRange: boolean;
  createdAt: string;
}

interface DailyTarget {
  id: string;
  orderbookerId: string;
  target: number;
  month: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== HELPERS ====================
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function getTodayDay(): string {
  return DAYS[new Date().getDay()];
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "Rs. 0";
  return "Rs. " + Number(amount).toLocaleString("en-PK");
}

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

// ==================== API CLIENT ====================
const API_BASE = '/api';

async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('af_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ==================== MAIN APP ====================
export default function AlfalahApp() {
  const [user, setUser] = useState<UserObj | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('af_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('af_user');
        localStorage.removeItem('af_token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: UserObj, token: string) => {
    localStorage.setItem('af_user', JSON.stringify(userData));
    localStorage.setItem('af_token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('af_user');
    localStorage.removeItem('af_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AppShell user={user} onLogout={handleLogout} />;
}

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin }: { onLogin: (user: UserObj, token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      // Map website login response to UserObj
      const userData: UserObj = {
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        phone: data.user.phone,
        status: data.user.status,
        allRoutesEnabled: data.user.allRoutesEnabled,
        companyId: data.user.companyId,
        companies: data.user.companies,
      };
      onLogin(userData, data.token);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">AF</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Al-Falah Traders</h1>
          <p className="text-sm text-gray-500 mt-1">Order Booker App</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Username darain"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password darain"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-xl transition-colors text-base"
          >
            {submitting ? 'Login ho raha hai...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">Al-Falah Traders &copy; 2025</p>
      </div>
    </div>
  );
}

// ==================== APP SHELL ====================
const TABS = [
  { label: 'Route', icon: MapPin },
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Ledger', icon: BookOpen },
  { label: 'Profile', icon: User },
];

function AppShell({ user, onLogout }: { user: UserObj; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ height: '100dvh' }}>
      <div className="flex-1 overflow-hidden">
        {activeTab === 0 && <RoutePage user={user} />}
        {activeTab === 1 && <DashboardPage user={user} />}
        {activeTab === 2 && <LedgerPage user={user} />}
        {activeTab === 3 && <ProfilePage user={user} onLogout={onLogout} />}
      </div>
      <nav className="bg-white border-t border-gray-200 shadow-lg flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === i;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && <div className="w-1 h-1 bg-green-600 rounded-full" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ==================== ROUTE PAGE ====================
function RoutePage({ user }: { user: UserObj }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'visited' | 'overlimit'>('all');
  const [showRecovery, setShowRecovery] = useState<Shop | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showEODReport, setShowEODReport] = useState(false);
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showNotes, setShowNotes] = useState<Shop | null>(null);
  const isFriday = new Date().getDay() === 5;
  const todayDay = selectedDay;

  // ====== LIVE TRACKING STATE ======
  // routeStatus: 'not_started' = haven't started route yet (shops hidden)
  //              'active'       = route in progress (shops visible, recovery allowed)
  //              'ended'        = route ended for the day (visited shops read-only, not-visited = late recovery)
  const [routeStatus, setRouteStatus] = useState<'not_started' | 'active' | 'ended'>('not_started');
  const [routeSessionId, setRouteSessionId] = useState<string | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number; speed: number | null } | null>(null);
  const [trackingDuration, setTrackingDuration] = useState(0); // seconds
  const [totalDistance, setTotalDistance] = useState(0); // meters
  const [waypointCount, setWaypointCount] = useState(0);
  const [shopArrivals, setShopArrivals] = useState<Map<string, { arriveTime: number; lat: number; lng: number }>>(new Map());
  const [showRouteSummary, setShowRouteSummary] = useState(false);
  const [showEndRouteConfirm, setShowEndRouteConfirm] = useState(false);
  const gpsWatcherRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const trackingStartRef = useRef<number>(0);
  const distanceRef = useRef(0);
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const shopArrivalsRef = useRef<Map<string, { arriveTime: number; lat: number; lng: number }>>(new Map());
  const routeSessionRef = useRef<string | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Recover route status from localStorage on mount — reset if new day
  useEffect(() => {
    const savedStatus = localStorage.getItem('af_route_status');
    const savedDate = localStorage.getItem('af_route_date');
    const today = getTodayDateStr();

    if (savedDate && savedDate !== today) {
      // New day — reset everything
      localStorage.removeItem('af_route_status');
      localStorage.removeItem('af_route_date');
      localStorage.removeItem('af_active_route');
      setRouteStatus('not_started');
    } else if (savedStatus === 'active' || savedStatus === 'ended') {
      setRouteStatus(savedStatus as 'active' | 'ended');
    }

    if (!localStorage.getItem('af_route_date')) {
      localStorage.setItem('af_route_date', today);
    }
  }, []);

  // Online/Offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        let success = 0;
        let fail = 0;
        for (const entry of queue) {
          try {
            await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(entry) });
            success++;
          } catch { fail++; }
        }
        clearOfflineQueue();
        fetchShops();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // ====== Haversine distance calculation ======
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ====== Local waypoint storage for offline ======
  const WAYPOINT_QUEUE_KEY = 'af_waypoint_queue';
  const getWaypointQueue = (): any[] => {
    try { return JSON.parse(localStorage.getItem(WAYPOINT_QUEUE_KEY) || '[]'); } catch { return []; }
  };
  const addToWaypointQueue = (wp: any) => {
    const queue = getWaypointQueue();
    queue.push({ ...wp, queuedAt: new Date().toISOString() });
    localStorage.setItem(WAYPOINT_QUEUE_KEY, JSON.stringify(queue));
    setWaypointCount(prev => prev + 1);
  };
  const clearWaypointQueue = () => {
    localStorage.setItem(WAYPOINT_QUEUE_KEY, '[]');
  };

  // ====== Send location point to server (or queue offline) ======
  const sendLocationPoint = async (point: { lat: number; lng: number; accuracy?: number; speed?: number | null; altitude?: number | null; batteryLevel?: number | null; isOffline?: boolean }) => {
    const sessionId = routeSessionRef.current;
    if (!sessionId) return;

    const payload = { sessionId, ...point };

    if (navigator.onLine) {
      try {
        await apiFetch('/tracking/location', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        addToWaypointQueue(payload);
      }
    } else {
      addToWaypointQueue(payload);
    }
  };

  // ====== Check proximity to shop (within 50m) ======
  const checkShopProximity = (lat: number, lng: number) => {
    const PROXIMITY_THRESHOLD = 50; // meters
    for (const shop of shops) {
      const dist = haversine(lat, lng, shop.lat, shop.lng);
      if (dist <= PROXIMITY_THRESHOLD) {
        const arrivals = shopArrivalsRef.current;
        if (!arrivals.has(shop.id)) {
          // Arrived at shop
          const now = Date.now();
          arrivals.set(shop.id, { arriveTime: now, lat, lng });
          shopArrivalsRef.current = arrivals;
          setShopArrivals(new Map(arrivals));

          sendLocationPoint({ lat, lng });

          // Auto-mark visited via ShopVisit API
          if (!shop.visited) {
            setShops(prev => prev.map(s => s.id === shop.id ? { ...s, visited: true, lastVisitDate: getTodayDateStr() } : s));
            apiFetch(`/shops/${shop.id}/visits`, {
              method: 'POST',
              body: JSON.stringify({
                orderbookerId: user.id,
                gpsLat: lat,
                gpsLng: lng,
                inRange: true,
              }),
            }).catch(() => {});
          }
        }
        return shop.id;
      }
    }

    // Check if we left any shop (for stay duration)
    const arrivals = shopArrivalsRef.current;
    for (const [shopId, data] of arrivals) {
      const shop = shops.find(s => s.id === shopId);
      if (!shop) continue;
      const dist = haversine(lat, lng, shop.lat, shop.lng);
      if (dist > PROXIMITY_THRESHOLD * 1.5) {
        // Left the shop
        arrivals.delete(shopId);
        shopArrivalsRef.current = arrivals;
        setShopArrivals(new Map(arrivals));
      }
    }
    return null;
  };

  // ====== START ROUTE TRACKING ======
  const startRouteTracking = async () => {
    try {
      // Request GPS permission first
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });

      // Create route session on server
      const session = await apiFetch('/tracking/start', {
        method: 'POST',
        body: JSON.stringify({
          orderbookerId: user.id,
          startLat: pos.coords.latitude,
          startLng: pos.coords.longitude,
        }),
      });

      const sid = session.session?.id || session.id;
      setRouteSessionId(sid);
      routeSessionRef.current = sid;
      setRouteStatus('active');
      localStorage.setItem('af_route_status', 'active');
      localStorage.setItem('af_route_date', getTodayDateStr());
      trackingStartRef.current = Date.now();
      distanceRef.current = 0;
      prevPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      // Send initial position
      sendLocationPoint({
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy, speed: pos.coords.speed,
      });

      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setTrackingDuration(Math.round((Date.now() - trackingStartRef.current) / 1000));
      }, 1000);

      // Start GPS watcher — sends location every 10 seconds
      gpsWatcherRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed } = position.coords;
          setCurrentGps({ lat: latitude, lng: longitude, accuracy, speed });

          // Calculate distance
          if (prevPosRef.current) {
            const dist = haversine(prevPosRef.current.lat, prevPosRef.current.lng, latitude, longitude);
            if (dist > 5) { // Only count if moved > 5m
              distanceRef.current += dist;
              setTotalDistance(Math.round(distanceRef.current));
              prevPosRef.current = { lat: latitude, lng: longitude };
            }
          }

          // Throttle: send to server every 10 seconds
          const now = Date.now();
          if (now - lastSentRef.current >= 10000) {
            lastSentRef.current = now;
            sendLocationPoint({
              lat: latitude, lng: longitude, accuracy, speed,
            });
          }

          // Check shop proximity
          checkShopProximity(latitude, longitude);
        },
        (error) => {
          console.error('GPS watch error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );

      // Save active route state locally for recovery
      localStorage.setItem('af_active_route', JSON.stringify({
        sessionId: sid,
        startTime: trackingStartRef.current,
        date: getTodayDateStr(),
      }));

    } catch (err: any) {
      alert('GPS access denied! Route tracking ke liye GPS enable karein.');
    }
  };

  // ====== STOP ROUTE TRACKING ======
  const stopRouteTracking = async () => {
    // Clear GPS watcher
    if (gpsWatcherRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatcherRef.current);
      gpsWatcherRef.current = null;
    }

    // Clear duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // End session on server
    const sessionId = routeSessionRef.current;
    if (sessionId) {
      try {
        if (navigator.onLine) {
          await apiFetch('/tracking/end', {
            method: 'POST',
            body: JSON.stringify({ sessionId, totalDistance: distanceRef.current }),
          });
        } else {
          // Save end state locally
          const pending = getWaypointQueue();
          pending.push({
            type: 'end_session',
            sessionId,
            totalDistance: distanceRef.current,
            queuedAt: new Date().toISOString(),
          });
          localStorage.setItem(WAYPOINT_QUEUE_KEY, JSON.stringify(pending));
        }
      } catch {
        // Queue for later sync
      }
    }

    setRouteStatus('ended');
    setRouteSessionId(null);
    routeSessionRef.current = null;
    setCurrentGps(null);
    localStorage.removeItem('af_active_route');
    localStorage.setItem('af_route_status', 'ended');

    // Show route summary
    setShowRouteSummary(true);
  };

  // ====== Reset route for new day ======
  const resetRouteForNewDay = () => {
    setRouteStatus('not_started');
    localStorage.removeItem('af_route_status');
    setTrackingDuration(0);
    setTotalDistance(0);
    setWaypointCount(0);
    setShopArrivals(new Map());
    shopArrivalsRef.current = new Map();
    distanceRef.current = 0;
  };

  // ====== Recover active route on page reload ======
  useEffect(() => {
    const saved = localStorage.getItem('af_active_route');
    if (saved) {
      try {
        const { sessionId, startTime } = JSON.parse(saved);
        if (sessionId && startTime) {
          setRouteStatus('active');
          setRouteSessionId(sessionId);
          routeSessionRef.current = sessionId;
          trackingStartRef.current = startTime;
          distanceRef.current = 0;

          durationTimerRef.current = setInterval(() => {
            setTrackingDuration(Math.round((Date.now() - startTime) / 1000));
          }, 1000);

          // Re-start GPS watcher
          gpsWatcherRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude, accuracy, speed } = position.coords;
              setCurrentGps({ lat: latitude, lng: longitude, accuracy, speed });

              if (prevPosRef.current) {
                const dist = haversine(prevPosRef.current.lat, prevPosRef.current.lng, latitude, longitude);
                if (dist > 5) {
                  distanceRef.current += dist;
                  setTotalDistance(Math.round(distanceRef.current));
                  prevPosRef.current = { lat: latitude, lng: longitude };
                }
              }

              const now = Date.now();
              if (now - lastSentRef.current >= 10000) {
                lastSentRef.current = now;
                sendLocationPoint({
                  lat: latitude, lng: longitude, accuracy, speed,
                });
              }

              checkShopProximity(latitude, longitude);
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
          );
        }
      } catch {}
    }
    return () => {
      if (gpsWatcherRef.current !== null) navigator.geolocation.clearWatch(gpsWatcherRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  // ====== Sync pending waypoints when back online ======
  useEffect(() => {
    const syncPendingWaypoints = async () => {
      const queue = getWaypointQueue();
      if (queue.length === 0 || !navigator.onLine) return;

      const waypoints = queue.filter((q: any) => q.type !== 'end_session');
      const endSession = queue.find((q: any) => q.type === 'end_session');

      try {
        // Sync waypoints
        if (waypoints.length > 0) {
          for (const wp of waypoints) {
            try {
              await apiFetch('/tracking/location', {
                method: 'POST',
                body: JSON.stringify({ ...wp }),
              });
            } catch {}
          }
        }

        // Sync end session if present
        if (endSession) {
          try {
            await apiFetch('/tracking/end', {
              method: 'POST',
              body: JSON.stringify({ sessionId: endSession.sessionId, totalDistance: endSession.totalDistance }),
            });
          } catch {}
        }

        clearWaypointQueue();
        setWaypointCount(0);

        // Also sync offline transactions
        const txQueue = getOfflineQueue();
        if (txQueue.length > 0) {
          for (const entry of txQueue) {
            try { await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(entry) }); } catch {}
          }
          clearOfflineQueue();
          fetchShops();
        }
      } catch {}
    };

    const handleOnline = () => syncPendingWaypoints();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Fetch companies
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const data = await apiFetch(`/companies?userId=${user.id}`);
        // Map website company response to Company type
        const mappedCompanies = (data as any[]).map((c: any) => ({
          id: c.companyId || c.id,
          name: c.companyName || c.name,
          status: 'active' as string,
          isPrimary: c.isPrimary,
        }));
        setCompanies(mappedCompanies);
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      }
    }
    fetchCompanies();
  }, [user.id]);

  const fetchShops = useCallback(async () => {
    try {
      const data = await apiFetch(`/shops?orderbookerId=${user.id}&routeDay=${todayDay}`);
      // Map website shop data to our Shop type
      const mappedShops = (data as any[]).map((s: any) => ({
        ...s,
        lat: s.lat || 0,
        lng: s.lng || 0,
        routeDays: s.routeDays || [],
        status: s.status || 'active',
        visited: false, // will be determined by today's visits
        lastVisitDate: '',
      }));

      // Fetch today's visits to determine visited status
      try {
        const visitsData = await apiFetch(`/visits/recent?orderbookerId=${user.id}&limit=200`);
        const todayStr = getTodayDateStr();
        const todayVisitShopIds = new Set(
          (visitsData as any[])
            .filter((v: any) => v.createdAt && v.createdAt.startsWith(todayStr))
            .map((v: any) => v.shopId)
        );
        mappedShops.forEach((s: any) => {
          if (todayVisitShopIds.has(s.id)) {
            s.visited = true;
            s.lastVisitDate = todayStr;
          }
        });
      } catch {}

      setShops(mappedShops);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, todayDay]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShops();
  };

  const markVisited = async (shop: Shop) => {
    try {
      // Update local state immediately
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, visited: true, lastVisitDate: getTodayDateStr() } : s));

      // Record shop visit via ShopVisit API (website doesn't have visited/lastVisitDate on Shop)
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        }).catch(() => null);
        await apiFetch(`/shops/${shop.id}/visits`, {
          method: 'POST',
          body: JSON.stringify({
            orderbookerId: user.id,
            gpsLat: pos?.coords.latitude || null,
            gpsLng: pos?.coords.longitude || null,
          }),
        });
      } catch {}
    } catch (err) {
      console.error('Failed to mark visited:', err);
    }
  };

  const filtered = shops.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.area.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'pending') return !s.visited;
    if (filter === 'visited') return s.visited;
    if (filter === 'overlimit') return s.creditLimit > 0 && (s.balance / s.creditLimit) >= 1;
    return true;
  });

  const visitedCount = shops.filter(s => s.visited).length;
  const totalOutstanding = shops.reduce((sum, s) => sum + s.balance, 0);
  const progress = shops.length > 0 ? (visitedCount / shops.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">
              {routeStatus === 'not_started' ? 'Route' : routeStatus === 'active' ? 'Active Route' : 'Route Ended'}
            </h1>
            <p className="text-green-100 text-xs">{formatDateDisplay(getTodayDateStr())}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {/* Route Tracking Toggle */}
            {routeStatus === 'active' ? (
              <button onClick={() => setShowEndRouteConfirm(true)} className="p-1.5 bg-red-500 rounded-full hover:bg-red-400 transition-colors animate-pulse" title="End Route">
                <MapPinned className="w-5 h-5" />
              </button>
            ) : routeStatus === 'not_started' ? (
              <button onClick={startRouteTracking} className="p-1.5 bg-green-700 rounded-full hover:bg-green-500 transition-colors" title="Start Route Tracking">
                <Route className="w-5 h-5" />
              </button>
            ) : null}
            <button onClick={() => setShowEODReport(true)} className="p-1.5 bg-green-700 rounded-full hover:bg-green-500 transition-colors" title="End of Day Report">
              <ClipboardList className="w-5 h-5" />
            </button>
            <button onClick={() => setShowRouteMap(true)} className="p-1.5 bg-green-700 rounded-full hover:bg-green-500 transition-colors" title="Route Map">
              <MapPinned className="w-5 h-5" />
            </button>
            <button onClick={handleRefresh} className="p-1.5 bg-green-700 rounded-full hover:bg-green-500 transition-colors" title="Refresh">
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="mb-2">
          <button
            onClick={() => setShowDayPicker(true)}
            className="inline-flex items-center gap-1 bg-green-500 border border-green-300 text-green-100 text-xs px-2 py-0.5 rounded-full font-medium capitalize hover:bg-green-400 transition-colors"
          >
            {selectedDay} Route
            <Calendar className="w-3 h-3" />
          </button>
          <span className="text-green-100 text-xs ml-2">Visited: {visitedCount}/{shops.length} shops</span>
        </div>
        {isFriday ? (
          <div className="bg-green-500 rounded-xl p-4 text-center">
            <span className="text-3xl">🕌</span>
            <p className="font-bold mt-1">Friday — Holiday</p>
            <p className="text-green-100 text-sm">Aaj Juma hai</p>
          </div>
        ) : routeStatus === 'not_started' ? (
          /* ====== ROUTE NOT STARTED — Show Start Button ====== */
          <div className="bg-green-500 rounded-xl p-4 text-center">
            <Route className="w-10 h-10 text-white mx-auto mb-2" />
            <p className="font-bold">Start Your Route</p>
            <p className="text-green-100 text-sm mt-1">Route start karne ke baad shops dikhai dengein</p>
          </div>
        ) : (
          <>
            <div className="bg-green-500 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{routeStatus === 'ended' ? 'Route Completed' : 'Visit Progress'}</span>
                <span>{visitedCount}/{shops.length}</span>
              </div>
              <div className="bg-green-400 rounded-full h-2">
                <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1 bg-green-500 rounded-xl p-2 text-center">
                <p className="text-green-100 text-xs">Outstanding</p>
                <p className="font-bold text-sm">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="flex-1 bg-green-500 rounded-xl p-2 text-center">
                <p className="text-green-100 text-xs">Visited</p>
                <p className="font-bold text-sm">{visitedCount} / {shops.length}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Live Tracking Status Bar */}
      {routeStatus === 'active' && (
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold tracking-wide">LIVE TRACKING</span>
            </div>
            <button onClick={stopRouteTracking} className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-red-400">
              Stop Route
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="text-center">
              <p className="text-[10px] text-green-200">Duration</p>
              <p className="text-xs font-bold">{formatDuration(trackingDuration)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-green-200">Distance</p>
              <p className="text-xs font-bold">{formatDistance(totalDistance)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-green-200">Shops</p>
              <p className="text-xs font-bold">{shopArrivals.size} / {shops.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-green-200">GPS</p>
              <p className="text-xs font-bold">{currentGps ? `${Math.round(currentGps.accuracy)}m` : '---'}</p>
            </div>
          </div>
          {getWaypointQueue().length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-300" />
              <span className="text-[10px] text-amber-200">{getWaypointQueue().length} waypoints pending sync</span>
            </div>
          )}
          {/* Currently at shop indicator */}
          {shopArrivals.size > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Array.from(shopArrivals.entries()).map(([shopId, data]) => {
                const shop = shops.find(s => s.id === shopId);
                if (!shop) return null;
                const staySec = Math.round((Date.now() - data.arriveTime) / 1000);
                return (
                  <span key={shopId} className="bg-green-500/50 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Store className="w-2.5 h-2.5" />
                    {shop.name} ({formatDuration(staySec)})
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== NOT STARTED — Big Start Route Screen ====== */}
      {!isFriday && routeStatus === 'not_started' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
              <Route className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Your Route</h2>
            <p className="text-gray-500 text-sm mb-6">Route start karne ke baad hi aaj ki shops dikhai dengein. GPS tracking bhi start hogi.</p>
            <button
              onClick={startRouteTracking}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-lg"
            >
              <Route className="w-6 h-6" /> Start Route
            </button>
            <p className="text-xs text-gray-400 mt-3">GPS access zaroori hai — location track hogi</p>
          </div>
        </div>
      )}

      {/* ====== ROUTE ACTIVE — Normal shop list with recovery ====== */}
      {!isFriday && routeStatus === 'active' && (
        <div className="flex-1 overflow-y-auto">
          {/* Offline Sync Banner */}
          {getOfflineQueue().length > 0 && (
            <div className={`border-b px-4 py-2 flex items-center justify-between ${
              isOnline ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>
                {getOfflineQueue().length} recovery entries {isOnline ? 'syncing...' : 'pending sync'}
              </span>
              {!isOnline && (
                <button
                  onClick={async () => {
                    const queue = getOfflineQueue();
                    for (const entry of queue) {
                      try { await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(entry) }); } catch {}
                    }
                    clearOfflineQueue();
                    fetchShops();
                  }}
                  className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-lg"
                >
                  Sync Now
                </button>
              )}
            </div>
          )}

          {/* Search + Company Filter */}
          <div className="px-4 pt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Shop ya owner ka naam dhundein..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Company Pills */}
            {companies.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCompany('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCompany === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  All Companies
                </button>
                {companies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompany(c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedCompany === c.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto">
            {[
              { key: 'all', label: 'Sab' },
              { key: 'pending', label: 'Pending' },
              { key: 'visited', label: 'Visited ✓' },
              { key: 'overlimit', label: 'Over Limit ⚠️' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Shop Cards */}
          <div className="px-4 pb-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Koi shop nahi mili</p>
              </div>
            ) : (
              filtered.map(shop => {
                const creditUtil = shop.creditLimit > 0 ? (shop.balance / shop.creditLimit) * 100 : 0;
                const isOverLimit = creditUtil >= 100;
                return (
                  <div key={shop.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800">{shop.name}</h3>
                        <p className="text-xs text-gray-500">{shop.area} {shop.ownerName ? `• ${shop.ownerName}` : ''}</p>
                      </div>
                      {shop.visited && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Visited
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Balance:</span>
                      <span className={`font-bold ${shop.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(shop.balance)}
                      </span>
                    </div>

                    {shop.creditLimit > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Credit: {formatCurrency(shop.creditLimit)}</span>
                          <span>{Math.round(creditUtil)}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              creditUtil < 80 ? 'bg-green-500' : creditUtil < 100 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(creditUtil, 100)}%` }}
                          />
                        </div>
                        {isOverLimit && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Over Credit Limit!
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!shop.visited) markVisited(shop);
                          setShowRecovery(shop);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                      >
                        <IndianRupee className="w-3.5 h-3.5" /> Collect Recovery
                      </button>
                      <button
                        onClick={() => setShowNotes(shop)}
                        className="bg-amber-50 text-amber-600 text-xs font-medium py-2 px-3 rounded-lg flex items-center gap-1"
                      >
                        <StickyNote className="w-3.5 h-3.5" /> Notes
                      </button>
                      {shop.phone && (
                        <a href={`tel:${shop.phone}`} className="bg-blue-50 text-blue-600 text-xs font-medium py-2 px-3 rounded-lg flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-50 text-amber-600 text-xs font-medium py-2 px-3 rounded-lg flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ====== ROUTE ENDED — Visited (read-only) + Not Visited (late recovery) ====== */}
      {!isFriday && routeStatus === 'ended' && (
        <div className="flex-1 overflow-y-auto">
          {/* Offline Sync Banner */}
          {(getOfflineQueue().length > 0 || getWaypointQueue().length > 0) && (
            <div className={`border-b px-4 py-2 flex items-center justify-between ${
              isOnline ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>
                {getOfflineQueue().length + getWaypointQueue().length} entries {isOnline ? 'syncing...' : 'pending sync'}
              </span>
            </div>
          )}

          {/* Route Ended Banner */}
          <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-800">Route Ended</p>
              <p className="text-xs text-blue-600">Aaj ka route complete ho chuka hai. Visited shops mein dobara recovery nahi ho sakti.</p>
            </div>
          </div>

          {/* SECTION 1: Visited Shops (Read-Only) */}
          {shops.filter(s => s.visited).length > 0 && (
            <div className="px-4 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-bold text-gray-700">Visited Shops</h3>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">{shops.filter(s => s.visited).length}</span>
              </div>
              <div className="space-y-2">
                {shops.filter(s => s.visited).map(shop => (
                  <div key={shop.id} className="bg-white rounded-xl border border-green-100 p-3 shadow-sm opacity-80">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800 text-sm truncate">{shop.name}</p>
                          <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">Visited</span>
                        </div>
                        <p className="text-xs text-gray-500">{shop.area} {shop.ownerName ? `• ${shop.ownerName}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${shop.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(shop.balance)}
                        </p>
                        <p className="text-[10px] text-gray-400">balance</p>
                      </div>
                    </div>
                    <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-center">
                      <p className="text-xs text-gray-400">Recovery already collected — dobara nahi ho sakti</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: Not Visited Shops (Late Recovery Allowed) */}
          {shops.filter(s => !s.visited).length > 0 && (
            <div className="px-4 pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-700">Not Visited Shops</h3>
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">{shops.filter(s => !s.visited).length}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">Late recovery allowed — description mein &quot;Late Recovery Added&quot; automatically likha jayega</p>
              </div>
              <div className="space-y-3">
                {shops.filter(s => !s.visited).map(shop => {
                  const creditUtil = shop.creditLimit > 0 ? (shop.balance / shop.creditLimit) * 100 : 0;
                  const isOverLimit = creditUtil >= 100;
                  return (
                    <div key={shop.id} className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800">{shop.name}</h3>
                          <p className="text-xs text-gray-500">{shop.area} {shop.ownerName ? `• ${shop.ownerName}` : ''}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Not Visited
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Balance:</span>
                        <span className={`font-bold ${shop.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(shop.balance)}
                        </span>
                      </div>
                      {shop.creditLimit > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Credit: {formatCurrency(shop.creditLimit)}</span>
                            <span>{Math.round(creditUtil)}%</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${creditUtil < 80 ? 'bg-green-500' : creditUtil < 100 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(creditUtil, 100)}%` }} />
                          </div>
                          {isOverLimit && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Over Credit Limit!
                            </p>
                          )}
                        </div>
                      )}
                      {/* Late Recovery Button */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRecovery(shop)}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <IndianRupee className="w-3.5 h-3.5" /> Late Recovery
                        </button>
                        <button
                          onClick={() => setShowNotes(shop)}
                          className="bg-amber-50 text-amber-600 text-xs font-medium py-2 px-3 rounded-lg flex items-center gap-1"
                        >
                          <StickyNote className="w-3.5 h-3.5" />
                        </button>
                        {shop.phone && (
                          <a href={`tel:${shop.phone}`} className="bg-blue-50 text-blue-600 text-xs font-medium py-2 px-3 rounded-lg flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Day Reset Button */}
          <div className="px-4 pb-6">
            <button
              onClick={resetRouteForNewDay}
              className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> New Day — Reset Route
            </button>
          </div>
        </div>
      )}

      {/* Route Map Modal */}
      {showRouteMap && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowRouteMap(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MapPinned className="w-5 h-5 text-green-600" /> Route Map
              </h3>
              <button onClick={() => setShowRouteMap(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="w-full h-56 bg-gray-100">
              {shops.length > 0 ? (
                <iframe
                  width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${shops[0]?.lat},${shops[0]?.lng}&destination=${shops[shops.length-1]?.lat},${shops[shops.length-1]?.lng}&waypoints=${shops.slice(1, -1).map(s => s.lat + ',' + s.lng).join('|')}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Koi shop nahi mili is route par</p>
                </div>
              )}
            </div>
            <div className="overflow-y-auto p-4 space-y-2" style={{ maxHeight: '30vh' }}>
              {shops.map((shop, idx) => (
                <a key={shop.id} href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{shop.name}</p>
                    <p className="text-xs text-gray-500">{shop.area}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${shop.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(shop.balance)}</p>
                  </div>
                  <Navigation className="w-4 h-4 text-green-600 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* End Route Confirmation */}
      {showEndRouteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setShowEndRouteConfirm(false)}>
          <div className="bg-white rounded-2xl w-[90%] max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-3">
                <MapPinned className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">End Route?</h3>
              <p className="text-sm text-gray-500 mt-1">Kya aaj ka route khatam karna hai? End ke baad visited shops mein dobara recovery nahi ho sakti.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEndRouteConfirm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-sm">
                Cancel
              </button>
              <button onClick={async () => {
                setShowEndRouteConfirm(false);
                await stopRouteTracking();
              }} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm">
                End Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Summary Modal */}
      {showRouteSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowRouteSummary(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Route className="w-5 h-5 text-green-600" /> Route Summary
              </h3>
              <button onClick={() => setShowRouteSummary(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-green-600">Total Duration</p>
                  <p className="font-bold text-green-700">{formatDuration(trackingDuration)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                  <Navigation className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-blue-600">Total Distance</p>
                  <p className="font-bold text-blue-700">{formatDistance(totalDistance)}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                  <Store className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs text-amber-600">Shops Visited</p>
                  <p className="font-bold text-amber-700">{shopArrivals.size} / {shops.length}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                  <MapPinned className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-purple-600">Waypoints</p>
                  <p className="font-bold text-purple-700">{waypointCount}</p>
                </div>
              </div>

              {/* Shop Visits with Stay Duration */}
              {shopArrivals.size > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Shop Visits</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Array.from(shopArrivals.entries()).map(([shopId, data]) => {
                      const shop = shops.find(s => s.id === shopId);
                      if (!shop) return null;
                      const staySec = Math.round((Date.now() - data.arriveTime) / 1000);
                      return (
                        <div key={shopId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Store className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{shop.name}</p>
                            <p className="text-xs text-gray-500">{shop.area}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-green-600">{formatDuration(staySec)}</p>
                            <p className="text-[10px] text-gray-400">stay time</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sync Status */}
              {getWaypointQueue().length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">{getWaypointQueue().length} waypoints pending</p>
                    <p className="text-[10px] text-amber-600">Internet se connect hone par auto-sync hoga</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setShowRouteSummary(false)} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-medium mt-4">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Day Picker Modal */}
      {showDayPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDayPicker(false)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" /> Select Route Day
              </h3>
              <button onClick={() => setShowDayPicker(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map(day => {
                const isToday = day === getTodayDay();
                const isSelected = day === selectedDay;
                const isHoliday = day === 'friday';
                return (
                  <button key={day} onClick={() => { setSelectedDay(day); setShowDayPicker(false); setLoading(true); }}
                    className={`p-3 rounded-xl text-sm font-medium capitalize transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-green-600 text-white' : isToday ? 'bg-green-50 text-green-700 border-2 border-green-300' : isHoliday ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}>
                    <span>{day}</span>
                    <div className="flex items-center gap-1">
                      {isToday && <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                      {isHoliday && <span className="text-xs">🕌</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EOD Report Modal */}
      {showEODReport && <EODReportModal user={user} shops={shops} onClose={() => setShowEODReport(false)} />}

      {/* Recovery Modal */}
      {showRecovery && (
        <RecoveryModal shop={showRecovery} user={user} companies={companies} selectedCompanyId={selectedCompany !== 'all' ? selectedCompany : undefined}
          isLateRecovery={routeStatus === 'ended' && !showRecovery?.visited}
          onClose={() => setShowRecovery(null)} onSuccess={() => { setShowRecovery(null); fetchShops(); }} />
      )}

      {/* Shop Notes Sheet */}
      {showNotes && <ShopNotesSheet shop={showNotes} user={user} onClose={() => setShowNotes(null)} />}
    </div>
  );
}

// ==================== SHOP NOTES SHEET ====================
function ShopNotesSheet({ shop, user, onClose }: { shop: Shop; user: UserObj; onClose: () => void }) {
  const [notes, setNotes] = useState<ShopNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const data = await apiFetch(`/shops/${shop.id}/notes`);
        setNotes(data);
      } catch (err) { console.error('Notes fetch error:', err); }
      finally { setLoading(false); }
    }
    fetchNotes();
  }, [shop.id]);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      const note = await apiFetch(`/shops/${shop.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim(), createdBy: user.id }),
      });
      setNotes(prev => [note, ...prev]);
      setNewNote('');
    } catch (err) { console.error('Note create error:', err); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-500" /> Notes — {shop.name}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          {/* Add Note */}
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Naya note likhein..." value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={handleSubmit} disabled={submitting || !newNote.trim()}
              className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:bg-green-400">
              {submitting ? '...' : <Plus className="w-4 h-4" />}
            </button>
          </div>
          {/* Notes List */}
          <div className="overflow-y-auto max-h-60 space-y-2">
            {loading ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : notes.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Koi note nahi hai</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-sm text-gray-800">{note.note}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{note.creator?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== NOTIFICATION TRACKING ====================
const NOTIF_LOG_KEY = 'af_notif_log';
const OFFLINE_QUEUE_KEY = 'af_offline_queue';

function getNotifLog(): Record<string, { shopId: string; channel: string; timestamp: string }[]> {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_LOG_KEY) || '{}');
  } catch { return {}; }
}

function logNotification(shopId: string, channel: string) {
  const log = getNotifLog();
  const todayKey = getTodayDateStr();
  if (!log[todayKey]) log[todayKey] = [];
  log[todayKey].push({ shopId, channel, timestamp: new Date().toISOString() });
  localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(log));
}

function getTodayNotifiedShopIds(): Set<string> {
  const log = getNotifLog();
  const todayKey = getTodayDateStr();
  const entries = log[todayKey] || [];
  return new Set(entries.map(e => e.shopId));
}

function getTodayNotifCount(): number {
  const log = getNotifLog();
  const todayKey = getTodayDateStr();
  return (log[todayKey] || []).length;
}

function getOfflineQueue(): any[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch { return []; }
}

function addToOfflineQueue(entry: any) {
  const queue = getOfflineQueue();
  queue.push({ ...entry, queuedAt: new Date().toISOString() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function clearOfflineQueue() {
  localStorage.setItem(OFFLINE_QUEUE_KEY, '[]');
}

// ==================== RECEIPT IMAGE GENERATOR ====================
function generateReceiptImage(data: {
  shopName: string; ownerName: string; date: string; amount: number;
  previousBalance: number; remainingBalance: number; collectedBy: string;
}): string {
  const W = 600, H = 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#16a34a'; ctx.fillRect(0, 0, W, 60);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Al-Falah Traders', W / 2, 26);
  ctx.font = '14px sans-serif'; ctx.fillText('Payment Receipt', W / 2, 48);
  const rows = [
    { label: 'Shop Name', value: data.shopName },
    { label: 'Owner', value: data.ownerName },
    { label: 'Date', value: data.date },
    { label: 'Recovery Received', value: `Rs. ${data.amount.toLocaleString('en-PK')}`, color: '#16a34a', bold: true },
    { label: 'Previous Balance', value: `Rs. ${data.previousBalance.toLocaleString('en-PK')}` },
    { label: 'Remaining Balance', value: `Rs. ${data.remainingBalance.toLocaleString('en-PK')}`, color: '#dc2626' },
    { label: 'Collected By', value: data.collectedBy },
  ];
  let y = 85;
  rows.forEach((row) => {
    ctx.fillStyle = '#6b7280'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(row.label + ':', 32, y);
    ctx.fillStyle = row.color || '#1f2937'; ctx.font = (row.bold ? 'bold ' : '') + '14px sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(row.value, W - 32, y);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(32, y + 10); ctx.lineTo(W - 32, y + 10); ctx.stroke();
    y += 40;
  });
  ctx.fillStyle = '#9ca3af'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Shukriya apna hisab clear karne ka — Al-Falah Traders', W / 2, H - 16);
  return canvas.toDataURL('image/png');
}

// ==================== EOD REPORT IMAGE GENERATOR ====================
function generateEODReportImage(data: {
  orderBookerName: string; date: string; totalRecovery: number; totalTransactions: number;
  routeShops: number; shopsVisited: number; waSmsSent: number; pendingNotifications: number;
  pendingShops: { name: string; ownerName: string }[];
}): string {
  const W = 600;
  const pendingCount = data.pendingShops.length;
  const H = 420 + Math.min(pendingCount, 8) * 28;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f0fdf4'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#16a34a'; ctx.fillRect(0, 0, W, 80);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Al-Falah Traders', W / 2, 32);
  ctx.font = '16px sans-serif'; ctx.fillText('End of Day Report', W / 2, 54);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#bbf7d0'; ctx.fillText(data.date, W / 2, 72);
  ctx.fillStyle = '#1f2937'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Order Booker:', 24, 108);
  ctx.font = '14px sans-serif'; ctx.fillStyle = '#374151'; ctx.fillText(data.orderBookerName, 150, 108);
  const stats = [
    { icon: '\uD83D\uDCB0', label: 'Total Recovery', value: `Rs. ${data.totalRecovery.toLocaleString('en-PK')}`, color: '#16a34a' },
    { icon: '\uD83D\uDCC4', label: 'Total Transactions', value: String(data.totalTransactions), color: '#2563eb' },
    { icon: '\uD83C\uDFEA', label: 'Route Shops', value: String(data.routeShops), color: '#7c3aed' },
    { icon: '\u2705', label: 'Shops Visited', value: `${data.shopsVisited} / ${data.routeShops}`, color: '#16a34a' },
    { icon: '\uD83D\uDCF1', label: 'WA / SMS Sent', value: String(data.waSmsSent), color: '#0891b2' },
    { icon: '\u23F3', label: 'Pending Notifications', value: String(data.pendingNotifications), color: '#d97706' },
  ];
  let y = 130;
  stats.forEach((stat) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(16, y - 4, W - 32, 30);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1; ctx.strokeRect(16, y - 4, W - 32, 30);
    ctx.fillStyle = '#1f2937'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${stat.icon}  ${stat.label}`, 28, y + 16);
    ctx.fillStyle = stat.color; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(stat.value, W - 28, y + 16);
    y += 36;
  });
  if (data.pendingShops.length > 0) {
    y += 8; ctx.fillStyle = '#d97706'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('\u26A0\uFE0F Pending Notify Shops:', 24, y + 4); y += 20;
    data.pendingShops.slice(0, 8).forEach((shop) => {
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(24, y - 2, W - 48, 24);
      ctx.fillStyle = '#92400e'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`\u2022 ${shop.name} (${shop.ownerName})`, 32, y + 14); y += 28;
    });
  }
  const footerY = H - 36;
  ctx.fillStyle = '#16a34a'; ctx.fillRect(0, footerY, W, 36);
  ctx.fillStyle = '#ffffff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Generated by Al-Falah Traders App', W / 2, footerY + 22);
  return canvas.toDataURL('image/png');
}

// ==================== EOD REPORT MODAL ====================
function EODReportModal({ user, shops, onClose }: { user: UserObj; shops: Shop[]; onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const todayStr = getTodayDateStr();

  useEffect(() => {
    async function fetchEODData() {
      try {
        const txData = await apiFetch(`/transactions?createdBy=${user.id}&type=recovery&date=${todayStr}`);
        setTransactions(txData);
      } catch (err) { console.error('EOD fetch error:', err); }
      finally { setLoading(false); }
    }
    fetchEODData();
  }, [user.id, todayStr]);

  const totalRecovery = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalTransactions = transactions.length;
  const routeShops = shops.length;
  const visitedShops = shops.filter(s => s.visited).length;
  const notifiedShopIds = getTodayNotifiedShopIds();
  const waSmsSent = getTodayNotifCount();
  const pendingNotifyShops = shops.filter(s => s.visited && !notifiedShopIds.has(s.id));
  const pendingNotifications = pendingNotifyShops.length;

  useEffect(() => {
    if (!loading) {
      const dateDisplay = new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const img = generateEODReportImage({
        orderBookerName: user.name, date: dateDisplay, totalRecovery, totalTransactions,
        routeShops, shopsVisited: visitedShops, waSmsSent, pendingNotifications,
        pendingShops: pendingNotifyShops.map(s => ({ name: s.name, ownerName: s.ownerName })),
      });
      setReportImage(img);
    }
  }, [loading, user.name, totalRecovery, totalTransactions, routeShops, visitedShops, waSmsSent, pendingNotifications]);

  const handleShareSave = async () => {
    if (!reportImage) return;
    setSharing(true);
    try {
      const blob = await (await fetch(reportImage)).blob();
      const file = new File([blob], `eod-report-${todayStr}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'End of Day Report', text: `Al-Falah Traders - EOD Report ${todayStr}` });
      } else {
        const a = document.createElement('a'); a.href = reportImage; a.download = `eod-report-${todayStr}.png`; a.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') { const a = document.createElement('a'); a.href = reportImage!; a.download = `eod-report-${todayStr}.png`; a.click(); }
    } finally { setSharing(false); }
  };

  const handleSendWA = (shop: Shop) => {
    const phone = shop.phone.replace(/\D/g, '').replace(/^0/, '92');
    const msg = encodeURIComponent(`Assalam-o-Alaikum, *${shop.ownerName}* sahib!\n\nAaj ki payment ki tasdeeq ke liye kindly apna balance confirm karein.\n\nShukriya!\n_Al-Falah Traders_`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    logNotification(shop.id, 'whatsapp');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white rounded-t-2xl">
          <h3 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5" /> End of Day Report</h3>
          <button onClick={onClose} className="p-1 text-green-100 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(90vh - 60px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 rounded-xl p-3 border border-green-100"><p className="text-xs text-green-600 font-medium">Total Recovery</p><p className="text-lg font-bold text-green-700">{formatCurrency(totalRecovery)}</p></div>
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100"><p className="text-xs text-blue-600 font-medium">Shops Visited</p><p className="text-lg font-bold text-blue-700">{visitedShops} / {routeShops}</p></div>
                <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-100"><p className="text-xs text-cyan-600 font-medium">WA/SMS Sent</p><p className="text-lg font-bold text-cyan-700">{waSmsSent}</p></div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100"><p className="text-xs text-amber-600 font-medium">Pending Notify</p><p className="text-lg font-bold text-amber-700">{pendingNotifications}</p></div>
              </div>
              {pendingNotifyShops.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-amber-600 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Pending Notify Shops</h4>
                  <div className="space-y-2">
                    {pendingNotifyShops.map(shop => (
                      <div key={shop.id} className="flex items-center justify-between bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <div><p className="font-medium text-gray-800 text-sm">{shop.name}</p><p className="text-xs text-gray-500">{shop.ownerName}</p></div>
                        <button onClick={() => handleSendWA(shop)} className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-green-600"><MessageSquare className="w-3 h-3" /> WA</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {reportImage && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Report Image Preview</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white"><img src={reportImage} alt="EOD Report" className="w-full" /></div>
                </div>
              )}
              <button onClick={handleShareSave} disabled={sharing || !reportImage}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {sharing ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sharing...</>) : (<><Share2 className="w-4 h-4" /> Report Image Share / Save karein</>)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== RECOVERY MODAL ====================
function RecoveryModal({ shop, user, companies, selectedCompanyId, isLateRecovery, onClose, onSuccess }: {
  shop: Shop; user: UserObj; companies: Company[]; selectedCompanyId?: string;
  isLateRecovery?: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [companyId, setCompanyId] = useState<string>(selectedCompanyId || '');
  const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000, 50000];

  // Missing info popup state
  const [showMissingInfo, setShowMissingInfo] = useState(false);
  const [pendingAction, setPendingAction] = useState<'receipt' | 'whatsapp' | 'sms' | null>(null);
  const [tempOwnerName, setTempOwnerName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Check if shop has owner name & phone — if not, show popup before proceeding
  const hasContactInfo = shop.ownerName?.trim() && shop.phone?.trim();
  const shopRef = useRef(shop);
  shopRef.current = shop;

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100 || amt > 500000) return;
    setSubmitting(true);

    // Build description — add "Late Recovery Added" if route ended
    let description = note || 'Cash received';
    if (isLateRecovery) {
      description = note ? `Late Recovery Added — ${note}` : 'Late Recovery Added';
    }

    const payload: any = {
      shopId: shop.id, type: 'recovery', amount: amt, createdBy: user.id,
      description,
      gpsLat: gpsLocation?.lat || null, gpsLng: gpsLocation?.lng || null,
      companyId: companyId || null,
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };

    try {
      if (!navigator.onLine) {
        addToOfflineQueue(payload);
        setSubmittedAmount(amt);
        setSuccess(true);
      } else {
        await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(payload) });
        setSubmittedAmount(amt);
        setSuccess(true);
      }
    } catch (err) {
      // Fallback to offline queue
      addToOfflineQueue(payload);
      setSubmittedAmount(amt);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const previousBalance = shop.balance;
  const remainingBalance = Math.max(0, shop.balance - submittedAmount);

  // Check contact info before proceeding with receipt/WhatsApp/SMS
  const checkAndProceed = (action: 'receipt' | 'whatsapp' | 'sms') => {
    if (!shop.ownerName?.trim() || !shop.phone?.trim()) {
      setTempOwnerName(shop.ownerName || '');
      setTempPhone(shop.phone || '');
      setPendingAction(action);
      setShowMissingInfo(true);
    } else {
      executeAction(action);
    }
  };

  // Save missing info to backend, then execute the pending action
  const saveAndProceed = async () => {
    if (!tempOwnerName.trim() || !tempPhone.trim()) return;
    setSavingInfo(true);
    try {
      await apiFetch(`/shops`, {
        method: 'PATCH',
        body: JSON.stringify({ id: shop.id, ownerName: tempOwnerName.trim(), phone: tempPhone.trim() }),
      });
      // Update local shop object so receipt/message uses new data
      shopRef.current = { ...shopRef.current, ownerName: tempOwnerName.trim(), phone: tempPhone.trim() };
      setShowMissingInfo(false);
      if (pendingAction) {
        executeAction(pendingAction, tempOwnerName.trim(), tempPhone.trim());
      }
    } catch (err) {
      alert('Info save nahi ho saki. Dubara try karein.');
    } finally {
      setSavingInfo(false);
      setPendingAction(null);
    }
  };

  // Execute the actual receipt/WhatsApp/SMS action
  const executeAction = (action: 'receipt' | 'whatsapp' | 'sms', overrideName?: string, overridePhone?: string) => {
    const ownerName = overrideName || shop.ownerName;
    const phone = overridePhone || shop.phone;

    if (action === 'receipt') {
      const dateStr = new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const receiptImg = generateReceiptImage({ shopName: shop.name, ownerName, date: dateStr, amount: submittedAmount, previousBalance, remainingBalance, collectedBy: user.name });
      const a = document.createElement('a'); a.href = receiptImg; a.download = `receipt-${shop.name.replace(/\s+/g, '-')}-${getTodayDateStr()}.png`; a.click();
    } else if (action === 'whatsapp') {
      const phoneClean = phone.replace(/\D/g, '').replace(/^0/, '92');
      const dateStr = new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
      const msg = encodeURIComponent(
        `\uD83C\uDFEA *Al-Falah Traders*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nAssalam-o-Alaikum, *${ownerName}* sahib!\n\nAaj *${dateStr}* ko aap ki taraf se payment moosool hui:\n\n\u2705 *Recovery Received:* Rs. ${submittedAmount.toLocaleString('en-PK')}\n\uD83D\uDCCB *Previous Balance:* Rs. ${previousBalance.toLocaleString('en-PK')}\n\uD83D\uDCB0 *Remaining Balance:* Rs. ${remainingBalance.toLocaleString('en-PK')}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nShukriya apna hisab clear karne ka...\n_Al-Falah Traders \u2014 ${dateStr}_`
      );
      window.open(`https://wa.me/${phoneClean}?text=${msg}`, '_blank');
      logNotification(shop.id, 'whatsapp');
    } else if (action === 'sms') {
      const phoneClean = phone.replace(/\D/g, '').replace(/^0/, '92');
      const dateStr = new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
      const msg = encodeURIComponent(`Al-Falah Traders: ${ownerName} sahib, Rs. ${submittedAmount.toLocaleString('en-PK')} recovery mili. Balance: Rs. ${remainingBalance.toLocaleString('en-PK')}. Shukriya! - ${dateStr}`);
      window.open(`sms:${phoneClean}?body=${msg}`, '_blank');
      logNotification(shop.id, 'sms');
    }
  };

  if (success) {
    return (
      <>
        {/* Missing Info Popup — shown before receipt/WhatsApp/SMS if owner name or phone is missing */}
        {showMissingInfo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setShowMissingInfo(false)}>
            <div className="bg-white rounded-2xl w-[90%] max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Contact Info Missing!</h4>
                  <p className="text-xs text-gray-500">Receipt bhejne ke liye owner ka naam aur number zaroori hai</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Owner Name</label>
                  <input
                    type="text"
                    value={tempOwnerName}
                    onChange={e => setTempOwnerName(e.target.value)}
                    placeholder="Shopkeeper ka naam likhein"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    value={tempPhone}
                    onChange={e => setTempPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowMissingInfo(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAndProceed}
                  disabled={savingInfo || !tempOwnerName.trim() || !tempPhone.trim()}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm disabled:bg-green-400 flex items-center justify-center gap-1"
                >
                  {savingInfo ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    'Save & Proceed'
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">Yeh info server pe save hogi aur future receipts mein use hogi</p>
            </div>
          </div>
        )}

        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onSuccess}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Recovery Submitted!</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(submittedAmount)}</p>
              <p className="text-sm text-gray-500 mt-1">Pending admin approval</p>
              <div className="bg-gray-50 rounded-xl p-3 mt-3 text-left">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Previous Balance:</span><span className="font-bold text-gray-800">{formatCurrency(previousBalance)}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-green-600 font-medium">Recovery:</span><span className="font-bold text-green-600">-{formatCurrency(submittedAmount)}</span></div>
                <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between text-sm"><span className="text-red-600 font-medium">Remaining Balance:</span><span className="font-bold text-red-600">{formatCurrency(remainingBalance)}</span></div>
              </div>
              {/* Warning if contact info missing */}
              {(!shop.ownerName?.trim() || !shop.phone?.trim()) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-amber-700">Contact Info Missing!</p>
                    <p className="text-[11px] text-amber-600">Receipt bhejne se pehle owner ka naam aur number add karein</p>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <button onClick={() => checkAndProceed('receipt')} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Receipt Gallery mein Save karein
                </button>
                <button onClick={() => checkAndProceed('whatsapp')} className="w-full bg-green-500 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> WhatsApp Message Bhejein
                </button>
                <button onClick={() => checkAndProceed('sms')} className="w-full bg-blue-500 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> SMS Bhejein
                </button>
                <button onClick={onSuccess} className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-medium text-sm">Skip, baad mein bhejein →</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {isLateRecovery ? 'Late Recovery' : 'Collect Recovery'}
            </h3>
            {isLateRecovery && (
              <p className="text-xs text-amber-600 mt-0.5">Route ended — Late Recovery Added tag automatically lagega</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-red-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-red-600">Current Balance</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(shop.balance)}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 text-sm">Rs.</span>
              <input type="number" min={100} max={500000} placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-green-100">
                {a >= 1000 ? `${a / 1000}K` : a}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <input type="text" placeholder="e.g. Cash received" maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {/* Company Dropdown */}
          {companies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">No Company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GPS Location</label>
            <button onClick={() => {
              setCapturingGps(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => { setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setCapturingGps(false); },
                () => { setCapturingGps(false); },
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }} disabled={capturingGps}
              className="w-full bg-blue-50 text-blue-600 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm border border-blue-100 hover:bg-blue-100 disabled:bg-blue-25">
              {capturingGps ? (<><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Capturing...</>) :
               gpsLocation ? (<><Check className="w-4 h-4 text-green-600" />Location Captured ({gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)})</>) :
               (<><Camera className="w-4 h-4" /> Capture Location</>)}
            </button>
          </div>
          <button onClick={handleSubmit} disabled={submitting || !amount || parseFloat(amount) < 100}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-xl transition-colors">
            {submitting ? 'Submitting...' : isLateRecovery ? 'Submit Late Recovery' : 'Submit Recovery'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== DASHBOARD PAGE ====================
function DashboardPage({ user }: { user: UserObj }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyTarget, setDailyTarget] = useState<DailyTarget | null>(null);
  const todayDay = getTodayDay();
  const todayStr = getTodayDateStr();

  useEffect(() => {
    async function fetchData() {
      try {
        const [shopsData, txData] = await Promise.all([
          apiFetch(`/shops?orderbookerId=${user.id}&routeDay=${todayDay}`),
          apiFetch(`/transactions?createdBy=${user.id}&type=recovery&date=${todayStr}`),
        ]);
        // Map website shop data
        const mappedShops = (shopsData as any[]).map((s: any) => ({
          ...s,
          lat: s.lat || 0,
          lng: s.lng || 0,
          routeDays: s.routeDays || [],
          status: s.status || 'active',
          visited: false,
          lastVisitDate: '',
        }));
        // Fetch today's visits for visited status
        try {
          const visitsData = await apiFetch(`/visits/recent?orderbookerId=${user.id}&limit=200`);
          const todayVisitShopIds = new Set(
            (visitsData as any[])
              .filter((v: any) => v.createdAt && v.createdAt.startsWith(todayStr))
              .map((v: any) => v.shopId)
          );
          mappedShops.forEach((s: any) => {
            if (todayVisitShopIds.has(s.id)) {
              s.visited = true;
              s.lastVisitDate = todayStr;
            }
          });
        } catch {}
        setShops(mappedShops);
        setTransactions(txData);
      } catch (err) { console.error('Dashboard fetch error:', err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [user.id, todayDay, todayStr]);

  // Fetch daily target
  useEffect(() => {
    async function fetchTarget() {
      try {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const data = await apiFetch(`/users/${user.id}/daily-target?month=${monthStr}`);
        setDailyTarget(data);
      } catch (err) { console.error('Target fetch error:', err); }
    }
    fetchTarget();
  }, [user.id]);

  // 7-day recovery data
  const [weekData, setWeekData] = useState<{ day: string; amount: number }[]>([]);

  useEffect(() => {
    async function fetchWeek() {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const txData = await apiFetch(`/transactions?createdBy=${user.id}&type=recovery&startDate=${startStr}&limit=500`);
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          dayMap[key] = 0;
        }
        (txData as Transaction[]).forEach(tx => { const txDate = tx.createdAt?.slice(0, 10) || ''; if (dayMap[txDate] !== undefined) dayMap[txDate] += tx.amount; });
        const result = Object.entries(dayMap).map(([date, amount]) => {
          const d = new Date(date);
          return { day: dayLabels[d.getDay()], amount };
        });
        setWeekData(result);
      } catch (err) { console.error('Week data error:', err); }
    }
    fetchWeek();
  }, [user.id]);

  if (loading) {
    return (<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>);
  }

  const visitedCount = shops.filter(s => s.visited).length;
  const pendingCount = shops.length - visitedCount;
  const todayRecovery = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const overLimitCount = shops.filter(s => s.creditLimit > 0 && (s.balance / s.creditLimit) >= 1).length;
  const pendingApprovalCount = transactions.filter(tx => tx.status !== 'approved').length;

  // Monthly recovery for target
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const [monthRecovery, setMonthRecovery] = useState(0);

  useEffect(() => {
    async function fetchMonthRecovery() {
      try {
        const monthTx = await apiFetch(`/transactions?createdBy=${user.id}&type=recovery&startDate=${monthStart}&limit=5000`);
        const total = (monthTx as Transaction[]).reduce((sum, tx) => sum + tx.amount, 0);
        setMonthRecovery(total);
      } catch (err) { console.error('Month recovery error:', err); }
    }
    fetchMonthRecovery();
  }, [user.id, monthStart]);

  const targetAmount = dailyTarget?.target || 0;
  const targetProgress = targetAmount > 0 ? Math.min((monthRecovery / targetAmount) * 100, 100) : 0;

  const pieData = [
    { name: 'Visited', value: visitedCount, color: '#16a34a' },
    { name: 'Pending', value: pendingCount, color: '#d1d5db' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="bg-green-600 text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <p className="text-green-100 text-xs">{formatDateDisplay(getTodayDateStr())}</p>
      </div>
      <div className="px-4 py-4 space-y-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-600 text-white rounded-xl p-4">
            <p className="text-green-100 text-xs">Aaj ki Recovery</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(todayRecovery)}</p>
            <p className="text-green-200 text-xs mt-1">{transactions.length} transactions</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-xs">Aaj ke Route Shops</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{shops.length}</p>
            {overLimitCount > 0 && <p className="text-red-600 text-xs mt-1">{overLimitCount} over limit</p>}
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-xs">Visited Shops</p>
            <p className="text-xl font-bold text-green-600 mt-1">{visitedCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-xs">Pending Approval</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{pendingApprovalCount}</p>
          </div>
        </div>

        {/* Monthly Target Progress */}
        {targetAmount > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" /> Monthly Target
              </h3>
              <span className="text-xs text-gray-500">{Math.round(targetProgress)}%</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Rs. {monthRecovery.toLocaleString('en-PK')} collected</span>
              <span>Target: {formatCurrency(targetAmount)}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-3">
              <div className="bg-green-600 rounded-full h-3 transition-all" style={{ width: `${targetProgress}%` }} />
            </div>
          </div>
        )}

        {/* Visit Status Pie Chart */}
        {shops.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Visit Status</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-600 rounded-full" /><span className="text-xs text-gray-600">Visited ({visitedCount})</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded-full" /><span className="text-xs text-gray-600">Pending ({pendingCount})</span></div>
            </div>
          </div>
        )}

        {/* 7-Day Recovery Bar Chart */}
        {weekData.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">7-Din ki Recovery</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v >= 1000 ? `${Math.round(v / 1000)}K` : v}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== LEDGER PAGE ====================
function LedgerPage({ user }: { user: UserObj }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    async function fetchShops() {
      try {
        const data = await apiFetch(`/shops?orderbookerId=${user.id}`);
        // Map website shop data
        const mappedShops = (data as any[]).map((s: any) => ({
          ...s,
          lat: s.lat || 0,
          lng: s.lng || 0,
          routeDays: s.routeDays || [],
          status: s.status || 'active',
          visited: false,
          lastVisitDate: '',
        }));
        setShops(mappedShops);
      } catch (err) { console.error('Ledger shops error:', err); }
      finally { setLoading(false); }
    }
    fetchShops();
  }, [user.id]);

  const openLedger = async (shop: Shop) => {
    setSelectedShop(shop);
    setLedgerLoading(true);
    try {
      const data = await apiFetch(`/reports/ledger?shopId=${shop.id}`);
      // Map ledger transactions if needed
      if (data.transactions) {
        data.transactions = data.transactions.map((tx: any) => ({
          ...tx,
          date: tx.createdAt || tx.date,
        }));
      }
      setLedger(data);
    } catch (err) { console.error('Ledger error:', err); }
    finally { setLedgerLoading(false); }
  };

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.area.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedShop) {
    return <LedgerView shop={selectedShop} ledger={ledger} loading={ledgerLoading} onBack={() => { setSelectedShop(null); setLedger(null); }} />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-green-600 text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-lg font-bold">Shop Ledger</h1>
        <p className="text-green-100 text-xs">Account statements</p>
      </div>
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Shop dhundein..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (<div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>) :
         filtered.length === 0 ? (<div className="text-center py-10 text-gray-400">Koi shop nahi mili</div>) :
         filtered.map(shop => (
          <button key={shop.id} onClick={() => openLedger(shop)}
            className="w-full bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="text-left"><h3 className="font-bold text-gray-800 text-sm">{shop.name}</h3><p className="text-xs text-gray-500">{shop.area}</p></div>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${shop.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(shop.balance)}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== LEDGER VIEW ====================
function LedgerView({ shop, ledger, loading, onBack }: {
  shop: Shop; ledger: LedgerData | null; loading: boolean; onBack: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [ownerName, setOwnerName] = useState(shop.ownerName);
  const [phone, setPhone] = useState(shop.phone);
  const [saving, setSaving] = useState(false);
  const [visits, setVisits] = useState<ShopVisit[]>([]);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchVisits() {
      try {
        const data = await apiFetch(`/shops/${shop.id}/visits`);
        setVisits(data.slice(0, 3));
      } catch (err) { console.error('Visits fetch error:', err); }
    }
    fetchVisits();
  }, [shop.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/shops`, { method: 'PATCH', body: JSON.stringify({ id: shop.id, ownerName, phone }) });
      setShowEdit(false);
    } catch (err) { console.error('Save error:', err); }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-green-600 text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-lg font-bold">{shop.name}</h1><p className="text-green-100 text-xs">{shop.area} • {shop.address}</p></div>
        </div>
      </div>
      <div className="px-4 pt-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Balance</span>
            <span className={`text-2xl font-bold ${shop.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(shop.balance)}</span>
          </div>
          {ledger && (
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Credit: {formatCurrency(ledger.summary.totalCredit)}</span>
              <span>Debit: {formatCurrency(ledger.summary.totalDebit)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Last 3 Visits */}
      {visits.length > 0 && (
        <div className="px-4 pt-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1"><MapPinned className="w-4 h-4 text-green-600" /> Last Visits</h4>
            <div className="space-y-2">
              {visits.map(v => (
                <div key={v.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{formatDateDisplay(v.createdAt)}</span>
                  {v.gpsLat && v.gpsLng && (
                    <a href={`https://www.google.com/maps?q=${v.gpsLat},${v.gpsLng}`} target="_blank" rel="noopener noreferrer"
                      className="text-green-600 font-medium flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Location
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Actions */}
      <div className="px-4 pt-3 flex gap-2">
        <button onClick={() => setShowEdit(true)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
          <Edit3 className="w-3.5 h-3.5" /> Edit Contact
        </button>
        {phone && (
          <>
            <button onClick={() => window.open(`https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '92')}`, '_blank')} className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button onClick={() => window.open(`sms:${phone.replace(/\D/g, '').replace(/^0/, '92')}`, '_blank')} className="flex-1 bg-amber-50 text-amber-600 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
              <Send className="w-3.5 h-3.5" /> SMS
            </button>
          </>
        )}
      </div>

      {/* Transaction History */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (<div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>) :
         ledger && ledger.transactions.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-bold text-gray-800 text-sm mb-2">Transaction History</h3>
            {ledger.transactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{formatDateDisplay(tx.createdAt)}</p>
                      {tx.status === 'approved' ? (
                        <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Approved
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{tx.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${tx.type === 'recovery' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'recovery' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                    {/* ONLY show edit/delete for PENDING (non-approved) transactions */}
                    {tx.status !== 'approved' && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditTx(tx); setEditAmount(String(tx.amount)); setEditNote(tx.description); }}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit pending recovery">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTx(tx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg" title="Delete pending recovery">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Koi transaction nahi mili</p></div>
        )}
      </div>

      {/* Edit Pending Recovery Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setEditTx(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Edit Pending Recovery
              </h3>
              <button onClick={() => setEditTx(null)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
              <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Yeh recovery abhi Pending hai — sirf pending edit ho sakti hai
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 text-sm">Rs.</span>
                  <input type="number" min={100} max={500000}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input type="text" maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editNote} onChange={(e) => setEditNote(e.target.value)} />
              </div>
              <button onClick={async () => {
                const amt = parseFloat(editAmount);
                if (!amt || amt < 100) return;
                setEditSubmitting(true);
                try {
                  await apiFetch(`/transactions/edit-pending`, {
                    method: 'PATCH',
                    body: JSON.stringify({ id: editTx.id, amount: amt, description: editNote, updatedBy: user.id }),
                  });
                  setEditTx(null);
                  setRefreshKey(k => k + 1);
                } catch (err: any) {
                  alert(err.message || 'Edit failed');
                } finally { setEditSubmitting(false); }
              }} disabled={editSubmitting || !editAmount || parseFloat(editAmount) < 100}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl">
                {editSubmitting ? 'Updating...' : 'Update Recovery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Pending Recovery Confirmation Modal */}
      {deleteTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteTx(null)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-3">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete Pending Recovery?</h3>
              <p className="text-sm text-gray-500 mt-1">Rs. {deleteTx.amount.toLocaleString('en-PK')} ki pending recovery delete hogi. Approved recovery delete nahi ho sakti.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTx(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-sm">Cancel</button>
              <button onClick={async () => {
                setDeleteSubmitting(true);
                try {
                  await apiFetch(`/transactions?id=${deleteTx.id}&deletedBy=${user.id}`, { method: 'DELETE' });
                  setDeleteTx(null);
                  setRefreshKey(k => k + 1);
                } catch (err: any) {
                  alert(err.message || 'Delete failed — Approved recovery delete nahi ho sakti');
                  setDeleteTx(null);
                } finally { setDeleteSubmitting(false); }
              }} disabled={deleteSubmitting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm disabled:bg-gray-300">
                {deleteSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Contact</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input type="text" placeholder="e.g. Ahmed Khan" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" placeholder="e.g. 03001234567" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-xl">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PROFILE PAGE ====================
function ProfilePage({ user, onLogout }: { user: UserObj; onLogout: () => void }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [monthRecovery, setMonthRecovery] = useState(0);
  const [todayRecovery, setTodayRecovery] = useState(0);
  const [totalShops, setTotalShops] = useState(0);
  const [dayPerformance, setDayPerformance] = useState<{ date: string; dayName: string; amount: number; txCount: number; isToday: boolean }[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProtectionLock, setShowProtectionLock] = useState(false);
  const [protectionPin, setProtectionPin] = useState('');
  const [newProtectionPin, setNewProtectionPin] = useState('');
  const [confirmProtectionPin, setConfirmProtectionPin] = useState('');
  const [protectionSubmitting, setProtectionSubmitting] = useState(false);
  const [protectionError, setProtectionError] = useState('');
  const [protectionSuccess, setProtectionSuccess] = useState(false);
  const [protectionMode, setProtectionMode] = useState<'set' | 'edit' | 'remove'>('set');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const allShops = await apiFetch(`/shops?orderbookerId=${user.id}`);
        // Map website shop data
        const mappedShops = (allShops as any[]).map((s: any) => ({
          ...s,
          lat: s.lat || 0,
          lng: s.lng || 0,
          routeDays: s.routeDays || [],
          status: s.status || 'active',
          visited: false,
          lastVisitDate: '',
        }));
        setShops(mappedShops);
        setTotalShops(mappedShops.length);

        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const monthTx = await apiFetch(`/transactions?createdBy=${user.id}&type=recovery&startDate=${monthStart}&limit=5000`);
        const monthTotal = (monthTx as Transaction[]).reduce((sum, tx) => sum + tx.amount, 0);
        setMonthRecovery(monthTotal);

        const todayStr = getTodayDateStr();
        const todayTx = await apiFetch(`/transactions?createdBy=${user.id}&type=recovery&date=${todayStr}`);
        const todayTotal = (todayTx as Transaction[]).reduce((sum, tx) => sum + tx.amount, 0);
        setTodayRecovery(todayTotal);

        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const perf: { date: string; dayName: string; amount: number; txCount: number; isToday: boolean }[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const isToday = i === 0;
          const dayTx = (monthTx as Transaction[]).filter(tx => (tx.createdAt?.slice(0, 10) || '') === key);
          const amount = dayTx.reduce((sum, tx) => sum + tx.amount, 0);
          perf.push({ date: key, dayName: dayNames[d.getDay()], amount, txCount: dayTx.length, isToday });
        }
        setDayPerformance(perf);
      } catch (err) { console.error('Profile data error:', err); }
      finally { setLoading(false); }
    }
    fetchProfileData();
  }, [user.id]);

  const initial = user.name.charAt(0).toUpperCase();
  const roleDisplay = user.role === 'admin' ? 'Admin' : 'Order Booker';

  const maxAmount = Math.max(...dayPerformance.map(d => d.amount), 1);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Green Header */}
      <div className="bg-green-600 text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
        <h1 className="text-lg font-bold">My Profile</h1>
      </div>

      <div className="px-4 -mt-4 pb-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-green-700 text-2xl font-bold">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-800 text-lg truncate">{user.name}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
              <span className="inline-block bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full mt-1 font-medium">{roleDisplay}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">Username:</span>
              <span className="text-sm text-gray-800 font-medium">{user.username}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">Phone:</span>
                <a href={`tel:${user.phone}`} className="text-sm text-green-600 font-medium">{user.phone}</a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">Role:</span>
              <span className="text-sm text-gray-800 font-medium capitalize">{roleDisplay}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-green-600 font-medium">This Month</p>
            <p className="text-sm font-bold text-green-700">{formatCurrency(monthRecovery)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <Store className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-600 font-medium">Total Shops</p>
            <p className="text-sm font-bold text-blue-700">{totalShops}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <IndianRupee className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-amber-600 font-medium">Today</p>
            <p className="text-sm font-bold text-amber-700">{formatCurrency(todayRecovery)}</p>
          </div>
        </div>

        {/* Day-wise Performance Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" /> Day-wise Performance
          </h3>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-32 mb-2">
            {[...dayPerformance].reverse().map((d, i) => {
              const height = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
              const minH = d.amount > 0 ? 8 : 2;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{d.amount >= 1000 ? `${Math.round(d.amount / 1000)}K` : d.amount > 0 ? d.amount : ''}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${d.isToday ? 'bg-green-600' : d.amount > 0 ? 'bg-green-200' : 'bg-gray-100'}`}
                    style={{ height: `${Math.max(height, minH)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 mb-4">
            {[...dayPerformance].reverse().map((d, i) => (
              <span key={d.date} className={`flex-1 text-center text-xs ${d.isToday ? 'font-bold text-green-600' : 'text-gray-400'}`}>
                {d.dayName.substring(0, 3)}
              </span>
            ))}
          </div>

          {/* List View */}
          <div className="space-y-2">
            {dayPerformance.map(d => (
              <div key={d.date} className={`flex items-center justify-between rounded-xl p-3 ${d.isToday ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${d.isToday ? 'text-green-700' : 'text-gray-700'}`}>{d.dayName}</span>
                  {d.isToday && <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${d.amount > 0 ? 'text-green-600' : 'text-gray-400'}`}>{formatCurrency(d.amount)}</p>
                  {d.txCount > 0 && <p className="text-xs text-gray-400">{d.txCount} tx</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protection Lock Button */}
        <button onClick={() => {
          const existingPin = localStorage.getItem('af_protection_pin');
          if (existingPin) {
            setProtectionMode('edit');
          } else {
            setProtectionMode('set');
          }
          setProtectionPin('');
          setNewProtectionPin('');
          setConfirmProtectionPin('');
          setProtectionError('');
          setProtectionSuccess(false);
          setShowProtectionLock(true);
        }}
          className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 flex items-center gap-3 mb-3 hover:bg-gray-50 transition-colors">
          <Shield className="w-5 h-5 text-green-600" />
          <div className="text-left flex-1">
            <span className="text-sm font-medium text-gray-700">Protection Lock</span>
            <p className="text-xs text-gray-400">{localStorage.getItem('af_protection_pin') ? 'Lock active — tap to edit or remove' : 'Set a PIN to protect your app'}</p>
          </div>
          {localStorage.getItem('af_protection_pin') && <span className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" />}
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </button>

        {/* Logout Button */}
        <button onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-red-50 border border-red-200 rounded-xl py-3 px-4 flex items-center gap-3 mb-3 hover:bg-red-100 transition-colors">
          <LogOut className="w-5 h-5 text-red-600" />
          <span className="text-sm font-bold text-red-600">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-3">
                <LogOut className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Logout?</h3>
              <p className="text-sm text-gray-500 mt-1">Kya aap sure hain ke aap logout karna chahte hain?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-sm">Cancel</button>
              <button onClick={onLogout} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Protection Lock Modal */}
      {showProtectionLock && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowProtectionLock(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" /> Protection Lock
              </h3>
              <button onClick={() => setShowProtectionLock(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            {protectionSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Done!</h4>
                <p className="text-sm text-gray-500 mt-1">Protection lock updated successfully</p>
                <button onClick={() => setShowProtectionLock(false)}
                  className="mt-4 bg-green-600 text-white font-bold py-2.5 px-8 rounded-xl">OK</button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> App protection lock sirf app access ko secure karta hai. Username/Password yahan change nahi ho sakta.
                  </p>
                </div>

                {protectionMode === 'set' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New 4-Digit PIN</label>
                      <input type="password" maxLength={4} placeholder="e.g. 1234" inputMode="numeric"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newProtectionPin} onChange={(e) => setNewProtectionPin(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
                      <input type="password" maxLength={4} placeholder="Confirm PIN" inputMode="numeric"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={confirmProtectionPin} onChange={(e) => setConfirmProtectionPin(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    {protectionError && <p className="text-red-600 text-xs">{protectionError}</p>}
                    <button onClick={() => {
                      if (newProtectionPin.length !== 4) { setProtectionError('PIN 4 digits ka hona zaroori hai'); return; }
                      if (newProtectionPin !== confirmProtectionPin) { setProtectionError('Dono PIN match nahi kartay'); return; }
                      localStorage.setItem('af_protection_pin', newProtectionPin);
                      setProtectionSuccess(true);
                    }} disabled={newProtectionPin.length !== 4 || confirmProtectionPin.length !== 4}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-xl">
                      Set Protection PIN
                    </button>
                  </div>
                )}

                {protectionMode === 'edit' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current PIN</label>
                      <input type="password" maxLength={4} placeholder="Enter current PIN" inputMode="numeric"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={protectionPin} onChange={(e) => setProtectionPin(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New 4-Digit PIN</label>
                      <input type="password" maxLength={4} placeholder="New PIN" inputMode="numeric"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newProtectionPin} onChange={(e) => setNewProtectionPin(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New PIN</label>
                      <input type="password" maxLength={4} placeholder="Confirm new PIN" inputMode="numeric"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={confirmProtectionPin} onChange={(e) => setConfirmProtectionPin(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    {protectionError && <p className="text-red-600 text-xs">{protectionError}</p>}
                    <button onClick={() => {
                      const existingPin = localStorage.getItem('af_protection_pin');
                      if (protectionPin !== existingPin) { setProtectionError('Current PIN galat hai'); return; }
                      if (newProtectionPin.length !== 4) { setProtectionError('New PIN 4 digits ka hona zaroori hai'); return; }
                      if (newProtectionPin !== confirmProtectionPin) { setProtectionError('Dono PIN match nahi kartay'); return; }
                      localStorage.setItem('af_protection_pin', newProtectionPin);
                      setProtectionSuccess(true);
                    }} disabled={protectionPin.length !== 4 || newProtectionPin.length !== 4 || confirmProtectionPin.length !== 4}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl">
                      Update PIN
                    </button>
                    <button onClick={() => { setProtectionMode('remove'); setProtectionError(''); setProtectionPin(''); }}
                      className="w-full bg-white border border-red-200 text-red-600 font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> Remove Protection Lock
                    </button>
                  </div>
                )}

                {protectionMode === 'remove' && (
                  <div className="space-y-4">
                    <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                      <p className="text-xs text-red-700 font-medium">Agar lock remove karein toh app koi bhi open kar sakta hai. Sure hain?</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter Current PIN to Remove</label>
                      <input type="password" maxLength={4} placeholder="Enter current PIN" inputMode="numeric"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] text-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={protectionPin} onChange={(e) => setProtectionPin(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    {protectionError && <p className="text-red-600 text-xs">{protectionError}</p>}
                    <button onClick={() => {
                      const existingPin = localStorage.getItem('af_protection_pin');
                      if (protectionPin !== existingPin) { setProtectionError('PIN galat hai — lock remove nahi hoga'); return; }
                      localStorage.removeItem('af_protection_pin');
                      setProtectionSuccess(true);
                    }} disabled={protectionPin.length !== 4}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl">
                      Remove Lock
                    </button>
                    <button onClick={() => { setProtectionMode('edit'); setProtectionError(''); setProtectionPin(''); }}
                      className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-sm">Cancel</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
