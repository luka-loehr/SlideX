import React from 'react'

const Header = () => (
  <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-md">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <img src="/slidex-logo.svg" alt="SlideX" className="w-8 h-8" />
        <span className="text-2xl font-semibold tracking-wide">SlideX</span>
      </div>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm hover:underline"
      >
        GitHub
      </a>
    </div>
  </header>
)

export default Header
