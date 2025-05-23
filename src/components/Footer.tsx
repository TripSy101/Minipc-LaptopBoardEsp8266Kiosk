import React from 'react';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 py-2 px-4 text-white/70 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <span>ESQUIMA Kiosk v1.0.0</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Mail className="w-3 h-3 mr-1" />
            <a 
              href="mailto:tripsilogph09@gmail.com" 
              className="hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              tripsilogph09@gmail.com
            </a>
          </div>
          
          <div>
            <span>Dev: EsQuiMa © 2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;