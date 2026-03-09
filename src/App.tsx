import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  User, 
  GraduationCap, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Lock, 
  Unlock, 
  CreditCard, 
  MessageCircle,
  LogOut,
  ChevronRight,
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Types
interface UserData {
  id: number;
  name: string;
  email: string;
  contact: string;
  role: 'student' | 'tutor';
  is_member: boolean;
}

interface TutorProfile {
  id: number;
  name: string;
  email: string;
  education: string;
  experience: string;
  workplace: string;
  location: string;
  is_member: boolean;
}

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  contact: string;
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'profile-setup'>('landing');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    contact: '',
    education: '',
    experience: '',
    workplace: '',
    location: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [tutorsRes, studentsRes, unlockedRes, userRes] = await Promise.all([
        fetch('/api/tutors'),
        fetch('/api/students'),
        fetch(`/api/unlocked/${user.id}`),
        fetch(`/api/user/${user.id}`)
      ]);
      
      const tutorsData = await tutorsRes.json();
      const studentsData = await studentsRes.json();
      const unlockedData = await unlockedRes.json();
      const userData = await userRes.json();

      setTutors(tutorsData);
      setStudents(studentsData);
      setUnlockedIds(unlockedData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = view === 'login' ? '/api/login' : '/api/register';
    const body = view === 'login' 
      ? { email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password, name: formData.name, contact: formData.contact, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        if (view === 'login') {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
          setView('dashboard');
        } else {
          setMessage({ type: 'success', text: 'Registration successful! Please login.' });
          setView('login');
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tutor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          education: formData.education,
          experience: formData.experience,
          workplace: formData.workplace,
          location: formData.location
        })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated!' });
        setView('dashboard');
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (amount: number, purpose: string, targetId?: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, purpose, targetId })
      });
      const { paymentId } = await res.json();
      
      // Mock payment confirmation for demo
      // In real world, this would wait for GPay/Webhook
      const confirmRes = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      
      if (confirmRes.ok) {
        setMessage({ type: 'success', text: 'Payment successful!' });
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Payment failed' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setView('landing');
  };

  const GPayLink = "https://pay.google.com/gp/v/home/addcard"; // Placeholder or direct intent
  const WhatsAppLink = "https://wa.me/917339104733";

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-black/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Ve-Moura</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 -mt-1">Edu Tech</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:inline">Hello, {user.name}</span>
              <button 
                onClick={logout}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setView('login')}
                className="px-4 py-2 text-sm font-medium hover:bg-black/5 rounded-full transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => { setView('register'); setRole('student'); }}
                className="px-4 py-2 text-sm font-medium bg-[#5A5A40] text-white rounded-full hover:bg-[#4A4A30] transition-colors"
              >
                Join Now
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Landing Page */}
          {view === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-12"
            >
              <div className="space-y-6">
                <h2 className="text-6xl sm:text-8xl font-light tracking-tighter leading-none">
                  Global Learning <br />
                  <span className="italic font-serif">Redefined.</span>
                </h2>
                <p className="max-w-2xl mx-auto text-lg opacity-60">
                  Connecting passionate educators with eager students across the globe. 
                  Online or offline, find your perfect match today.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                    <User size={32} />
                  </div>
                  <h3 className="text-2xl font-medium">For Students</h3>
                  <p className="opacity-60 text-sm">Find expert tutors for any subject. Pay just $2 to unlock your future.</p>
                  <button 
                    onClick={() => { setView('register'); setRole('student'); }}
                    className="w-full py-4 bg-[#5A5A40] text-white rounded-full font-medium mt-4"
                  >
                    I want to Learn
                  </button>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                    <GraduationCap size={32} />
                  </div>
                  <h3 className="text-2xl font-medium">For Tutors</h3>
                  <p className="opacity-60 text-sm">Share your knowledge and earn. Become a member for $5 and reach thousands.</p>
                  <button 
                    onClick={() => { setView('register'); setRole('tutor'); }}
                    className="w-full py-4 border border-[#5A5A40] text-[#5A5A40] rounded-full font-medium mt-4"
                  >
                    I want to Teach
                  </button>
                </div>
              </div>

              <div className="pt-12 border-t border-black/5 flex flex-wrap justify-center gap-12 opacity-40 grayscale">
                <div className="flex items-center gap-2"><Globe size={20} /> <span>Global Access</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 size={20} /> <span>Verified Profiles</span></div>
                <div className="flex items-center gap-2"><CreditCard size={20} /> <span>Secure Payments</span></div>
              </div>
            </motion.div>
          )}

          {/* Login / Register */}
          {(view === 'login' || view === 'register') && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-xl border border-black/5"
            >
              <h2 className="text-3xl font-medium mb-8 text-center">
                {view === 'login' ? 'Welcome Back' : `Join as ${role}`}
              </h2>
              
              <form onSubmit={handleAuth} className="space-y-4">
                {view === 'register' && (
                  <>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-6 py-4 bg-[#F5F5F0] rounded-full outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Contact Number</label>
                      <input 
                        type="tel" 
                        required
                        className="w-full px-6 py-4 bg-[#F5F5F0] rounded-full outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all"
                        placeholder="+1 234 567 890"
                        value={formData.contact}
                        onChange={e => setFormData({...formData, contact: e.target.value})}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-6 py-4 bg-[#F5F5F0] rounded-full outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-6 py-4 bg-[#F5F5F0] rounded-full outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-4 bg-[#5A5A40] text-white rounded-full font-medium mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : (view === 'login' ? 'Login' : 'Create Account')}
                  <ChevronRight size={18} />
                </button>
              </form>

              <p className="text-center mt-6 text-sm opacity-60">
                {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setView(view === 'login' ? 'register' : 'login')}
                  className="ml-2 font-medium text-[#5A5A40] underline underline-offset-4"
                >
                  {view === 'login' ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </motion.div>
          )}

          {/* Dashboard */}
          {view === 'dashboard' && user && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Header Info */}
              <div className="bg-white p-8 rounded-[32px] border border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                    {user.role === 'tutor' ? <GraduationCap size={40} /> : <User size={40} />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-medium">{user.name}</h2>
                    <p className="opacity-60 flex items-center gap-2">
                      {user.role === 'tutor' ? 'Professional Educator' : 'Student'} 
                      <span className="w-1 h-1 bg-black/20 rounded-full"></span>
                      {user.email}
                    </p>
                  </div>
                </div>
                
                {!user.is_member && user.role === 'tutor' && (
                  <div className="bg-[#5A5A40]/5 border border-[#5A5A40]/10 p-6 rounded-2xl flex flex-col items-center gap-3">
                    <p className="text-sm font-medium text-[#5A5A40]">Become a Member to start teaching</p>
                    <button 
                      onClick={() => handlePayment(5, 'membership')}
                      className="px-6 py-3 bg-[#5A5A40] text-white rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      Pay $5 Membership
                    </button>
                  </div>
                )}

                {user.role === 'tutor' && user.is_member && (
                  <button 
                    onClick={() => setView('profile-setup')}
                    className="px-6 py-3 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium"
                  >
                    Edit Profile Details
                  </button>
                )}
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Stats/Info */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[24px] border border-black/5 space-y-4">
                    <h3 className="font-medium text-lg">Platform Support</h3>
                    <div className="space-y-3">
                      <a href={WhatsAppLink} target="_blank" className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors">
                        <MessageCircle size={20} />
                        <span className="text-sm font-medium">WhatsApp Support</span>
                      </a>
                      <a href="mailto:kichaneduaation@gmail.com" className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
                        <Mail size={20} />
                        <span className="text-sm font-medium">Email Support</span>
                      </a>
                      <div className="p-4 bg-orange-50 text-orange-700 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <CreditCard size={18} />
                          <span>GPay Payment</span>
                        </div>
                        <p className="text-xs opacity-80">Direct Payment: 7339104733</p>
                        <a href={GPayLink} target="_blank" className="block text-center py-2 bg-orange-600 text-white rounded-lg text-xs font-bold">Open GPay</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-medium">
                      {user.role === 'student' ? 'Available Tutors' : 'Student Requests'}
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-white border border-black/5 rounded-full text-sm outline-none focus:ring-2 ring-[#5A5A40]/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {user.role === 'student' ? (
                      tutors.map(tutor => (
                        <div key={tutor.id} className="bg-white p-6 rounded-[24px] border border-black/5 flex flex-col sm:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                                <GraduationCap size={24} />
                              </div>
                              <div>
                                <h4 className="font-medium text-lg">{tutor.name}</h4>
                                <p className="text-xs opacity-50 flex items-center gap-1"><MapPin size={12} /> {tutor.location}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                              <div className="flex items-center gap-2 opacity-70"><Briefcase size={14} /> {tutor.workplace}</div>
                              <div className="flex items-center gap-2 opacity-70"><BookOpen size={14} /> {tutor.education}</div>
                            </div>
                            <p className="text-sm opacity-60 line-clamp-2 italic">"{tutor.experience}"</p>
                          </div>
                          
                          <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                            {unlockedIds.includes(tutor.id) ? (
                              <div className="p-3 bg-green-50 border border-green-100 rounded-2xl space-y-1">
                                <p className="text-[10px] uppercase font-bold text-green-600">Contact Unlocked</p>
                                <p className="text-sm font-medium flex items-center gap-2"><Phone size={14} /> {tutors.find(t => t.id === tutor.id)?.email}</p>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handlePayment(2, 'unlock_contact', tutor.id)}
                                className="w-full py-3 bg-[#5A5A40] text-white rounded-full text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <Lock size={16} /> Unlock Contact ($2)
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Tutor View: Students
                      !user.is_member ? (
                        <div className="bg-white p-12 rounded-[32px] border border-dashed border-black/20 text-center space-y-4">
                          <Lock size={48} className="mx-auto opacity-20" />
                          <h4 className="text-xl font-medium">Membership Required</h4>
                          <p className="max-w-xs mx-auto text-sm opacity-50">Please complete your membership payment to view student profiles and start your teaching journey.</p>
                          <button 
                            onClick={() => handlePayment(5, 'membership')}
                            className="px-8 py-4 bg-[#5A5A40] text-white rounded-full font-medium"
                          >
                            Pay $5 Membership
                          </button>
                        </div>
                      ) : (
                        students.map(student => (
                          <div key={student.id} className="bg-white p-6 rounded-[24px] border border-black/5 flex flex-col sm:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                                <User size={24} />
                              </div>
                              <div>
                                <h4 className="font-medium text-lg">{student.name}</h4>
                                <p className="text-xs opacity-50">{student.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                              {unlockedIds.includes(student.id) ? (
                                <div className="p-3 bg-green-50 border border-green-100 rounded-2xl space-y-1">
                                  <p className="text-[10px] uppercase font-bold text-green-600">Contact Unlocked</p>
                                  <p className="text-sm font-medium flex items-center gap-2"><Phone size={14} /> {student.contact}</p>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handlePayment(2, 'unlock_contact', student.id)}
                                  className="w-full py-3 bg-[#5A5A40] text-white rounded-full text-sm font-medium flex items-center justify-center gap-2"
                                >
                                  <Lock size={16} /> Unlock Contact ($2)
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile Setup */}
          {view === 'profile-setup' && user && (
            <motion.div 
              key="profile-setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto bg-white p-10 rounded-[40px] shadow-xl border border-black/5"
            >
              <h2 className="text-3xl font-medium mb-8 text-center">Tutor Profile Details</h2>
              <form onSubmit={handleProfileSetup} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Education Background</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-6 py-4 bg-[#F5F5F0] rounded-full outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all"
                      placeholder="e.g. PhD in Mathematics"
                      value={formData.education}
                      onChange={e => setFormData({...formData, education: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Current Workplace</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-6 py-4 bg-[#F5F5F0] rounded-full outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all"
                      placeholder="e.g. Stanford University"
                      value={formData.workplace}
                      onChange={e => setFormData({...formData, workplace: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Location (City, Country)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-6 py-4 bg-[#F5F5F0] rounded-full outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all"
                    placeholder="e.g. London, UK"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-50 ml-4 mb-1 block">Teaching Experience Summary</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full px-6 py-4 bg-[#F5F5F0] rounded-[24px] outline-none focus:ring-2 ring-[#5A5A40]/20 transition-all resize-none"
                    placeholder="Tell students about your experience and teaching style..."
                    value={formData.experience}
                    onChange={e => setFormData({...formData, experience: e.target.value})}
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setView('dashboard')}
                    className="flex-1 py-4 border border-black/10 rounded-full font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={loading}
                    className="flex-[2] py-4 bg-[#5A5A40] text-white rounded-full font-medium disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-[100] ${
              message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-2 opacity-50 hover:opacity-100">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-black/5 py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
                <GraduationCap size={18} />
              </div>
              <h1 className="font-bold text-lg tracking-tight">Ve-Moura</h1>
            </div>
            <p className="text-sm opacity-50">Connecting the world through quality education. Online and offline tutoring for everyone.</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Contact Us</h4>
            <ul className="space-y-2 text-sm opacity-60">
              <li className="flex items-center gap-2"><Mail size={14} /> kichaneduaation@gmail.com</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +91 7339104733</li>
              <li className="flex items-center gap-2"><MessageCircle size={14} /> WhatsApp: 7339104733</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-60">
              <li><button onClick={() => setView('landing')} className="hover:text-[#5A5A40]">Home</button></li>
              <li><button onClick={() => setView('login')} className="hover:text-[#5A5A40]">Login</button></li>
              <li><button onClick={() => { setView('register'); setRole('tutor'); }} className="hover:text-[#5A5A40]">Become a Tutor</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-black/5 text-center text-[10px] uppercase tracking-widest opacity-30">
          © 2024 Ve-Moura Edu Tech. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
