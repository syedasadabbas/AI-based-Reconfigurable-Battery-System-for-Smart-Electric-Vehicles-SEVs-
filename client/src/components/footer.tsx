import { Github, Code2, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-blue-500/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Left: Creator Info */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm leading-tight">Syed Asad Abbas</p>
                <p className="text-blue-300 text-xs leading-tight">Software Engineer & Researcher</p>
              </div>
            </div>
          </div>

          {/* Center: Made by */}
          <div className="flex items-center gap-2 text-blue-200 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Crafted with precision for battery research</span>
          </div>

          {/* Right: GitHub Link */}
          <a
            href="https://github.com/syedasadabbas"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 group"
            data-testid="footer-github-link"
          >
            <Github className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-sm text-blue-200 group-hover:text-white font-medium transition-colors">
              syedasadabbas
            </span>
          </a>
        </div>

        {/* Bottom: Copyright */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Battery Configuration Simulator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
