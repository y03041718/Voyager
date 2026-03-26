import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Compass, BookOpen, User, PlusCircle } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-3 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Map className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter text-primary">VOYAGER</span>
        </div>

        <div className="flex flex-1 justify-around md:flex-none md:gap-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'
              }`
            }
          >
            <Compass className="w-6 h-6" />
            <span className="text-[10px] font-medium md:text-sm">探索</span>
          </NavLink>

          <NavLink
            to="/itinerary"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'
              }`
            }
          >
            <Map className="w-6 h-6" />
            <span className="text-[10px] font-medium md:text-sm">行程</span>
          </NavLink>

          <div className="flex flex-col items-center -mt-6 md:mt-0">
            <NavLink
              to="/plan"
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
            >
              <PlusCircle className="w-7 h-7" />
            </NavLink>
            <span className="text-[10px] font-medium text-primary mt-1 md:hidden">规划</span>
          </div>

          <NavLink
            to="/guides"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'
              }`
            }
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-[10px] font-medium md:text-sm">指南</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'
              }`
            }
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium md:text-sm">我的</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
