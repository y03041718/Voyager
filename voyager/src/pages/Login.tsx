import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    teamName: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // 清除错误信息
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password
        });
      } else {
        if (!formData.username.trim()) {
          setError('请输入用户名');
          return;
        }
        await register({
          username: formData.username,
          password: formData.password,
          teamName: formData.teamName || undefined
        });
      }
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作失败，请重试');
    }
  };

  const handleWeChatLogin = () => {
    // 微信登录的模拟实现
    setError('微信登录功能开发中...');
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-surface font-body text-on-surface antialiased">
      {/* Brand Floating Anchor */}
      <div className="fixed top-8 left-8 z-50">
        <a className="flex items-center gap-2 group" href="/">
          <span className="text-2xl font-bold tracking-tighter text-primary font-headline">Voyager</span>
        </a>
      </div>

      {/* Left Column: Form Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-16 xl:p-24 bg-surface">
        <div className="max-w-md w-full">
          {/* Header */}
          <header className="mb-10">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-3">
              {isLogin ? '开启您的旅程' : '加入我们'}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              加入我们的精英旅行社区，探索非凡世界。
            </p>
          </header>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface-variant ml-1" htmlFor="username">用户名</label>
                <input 
                  className="w-full px-4 py-3.5 bg-surface-container-low border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-outline" 
                  id="username" 
                  name="username" 
                  placeholder="请输入用户名" 
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              

              
              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-sm font-medium text-on-surface-variant" htmlFor="password">密码</label>
                  {isLogin && (
                    <a className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity" href="#">忘记密码？</a>
                  )}
                </div>
                <input 
                  className="w-full px-4 py-3.5 bg-surface-container-low border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-outline" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* CTA Button */}
            <button 
              className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 font-headline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? '立即登录' : '创建账号'}
            </button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-surface px-4 text-outline font-medium">或通过以下方式继续</span>
              </div>
            </div>

            {/* Social Logins - Changed to WeChat */}
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleWeChatLogin}
                className="flex items-center justify-center gap-3 px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg hover:bg-surface-container-high transition-colors duration-200 group" 
                type="button"
                disabled={loading}
              >
                <MessageCircle className="w-5 h-5 text-[#07C160]" />
                <span className="text-sm font-semibold text-on-surface">微信快捷登录</span>
              </button>
            </div>

            {/* Toggle Auth State */}
            <p className="text-center text-sm text-on-surface-variant mt-8">
              {isLogin ? '还没有账号？' : '已有账号？'} 
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 transition-all ml-1"
              >
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </p>
          </form>

          {/* Minimal Footer */}
          <footer className="mt-16 text-[10px] text-outline uppercase tracking-widest text-center">
            © 2024 Voyager Editorial. 保留所有权利。
          </footer>
        </div>
      </div>

      {/* Right Column: Visual Narrative */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-surface-container-low p-12">
        {/* Editorial Content Overlay */}
        <div className="relative h-full w-full flex flex-col justify-end z-10 p-8">
          <div className="max-w-md bg-surface/80 backdrop-blur-xl p-8 editorial-shadow asymmetric-clip">
            <div className="flex items-center gap-2 text-primary mb-4">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">今日焦点</span>
            </div>
            <h2 className="font-headline text-3xl font-bold text-on-surface mb-3 leading-tight">阿马尔菲海岸：永恒优雅的典范。</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">探索我们为您精心策划的地中海迷人海岸指南，专为挑剔的旅行者打造。</p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-surface overflow-hidden bg-surface-container-highest">
                  <img className="w-full h-full object-cover" alt="Guide writer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtugM7o_h0oXGH-8rW3OOVXK0HgGEQXbjY_7Dk9OuJpVkhX1g71k6qFam8yt3E_jr8BMpnEb42hJobow2GyDjSbvGNjwBtakXCkSltUL89EXOVbF5FU4yedXZX2Rwb7-KKwdwWSCVYMqp9wn80YI4Lmf9Xy1TmCvcOiztq5pB5QJKvoFIof1xM7ycu6RNgYOMC4JOnP92KwJGQIG5UEH78UVBBvMFSeiDTnB9I20zKtsCnC6aNWNVzY8MCPJe0Fn95Kbk9TuG-Eo2q"/>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-surface overflow-hidden bg-surface-container-highest">
                  <img className="w-full h-full object-cover" alt="Traveler" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeu_TCijlQDuRDXs7c_ACfxwRdFNhwHfXWnTEINbaY1_nyad8uSAfAMxSBaUEJXUHYVv5k84ziEfaHuZtONJgvvoXDZ9Up_pMhQ6OuidFKI9K0OOpoRcHQICN1wSB1_jibRPcLusfqpqQBMaEm2Ky6P7G8gEO1c5Yfe8Mi7UwBs7iUqdaom-8Lj_z2WsnT4D4-yYRRdVh0q-V_EhwIUkMpUsjHaAqMzdRjAmlYTmOlzICNFYHgFJP5iufQsiYoE80XLwRSf61uoaM7"/>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center bg-primary text-on-primary text-[10px] font-bold">+12</div>
              </div>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group cursor-pointer">
                查看指南 
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
              </span>
            </div>
          </div>
        </div>
        {/* Background Image with Editorial Masking */}
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover grayscale-[20%] brightness-[95%] contrast-[1.05]" alt="Amalfi Coast" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGwYQqZTr_DQXhHzSuHRWWl3get5TY5gU-56cJyuXiCYqYDSUel8Jxsvx7NLsD4vugDzAM6gMC6IEeo-_3H14OZOReRI6u1dp2YvtTGoKHykjjEfE6XWaoBKhJaTTtSN99LxdpH28HxTCV6dnd6Oc722JVhxws7ntrb92CmmsqQQHN0mDjnl2LWAuUfhmLocSfcet6OWHsHp3myaFqNLDG801sU-fa_fRI-nUzxhocnqyEVB9gfFoOmP7oBoZyRN1F5l0xpvUARQru"/>
          {/* Subtle Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent"></div>
        </div>
        {/* Floating Decorative Elements */}
        <div className="absolute top-12 right-12 z-20 flex gap-4">
          <nav className="flex gap-8 text-xs font-bold tracking-widest uppercase text-on-primary drop-shadow-sm">
            <a className="hover:opacity-70 transition-opacity" href="#">首页</a>
            <a className="hover:opacity-70 transition-opacity" href="#">探索</a>
          </nav>
        </div>
      </div>
    </main>
  );
};

export default Login;
